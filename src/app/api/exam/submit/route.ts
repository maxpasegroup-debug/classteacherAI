import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateNexaStudentMemoryAfterExam, type TrainerDebrief } from "@/lib/nexa-trainer-memory";
import { recordPerformanceAttemptMetrics } from "@/lib/performance-tracking";
import { adaptiveDifficulty, PASS_THRESHOLD_PCT } from "@/lib/top10-training-engine";
import { isTopRankPlan } from "@/lib/plan-tier";

export const runtime = "nodejs";
const EXAM_SUBMIT_GRACE_SECONDS = 10;

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    attemptId?: string;
    answers?: Array<{ questionId: string; answer: string }>;
  } | null;
  if (!body?.attemptId || !body.answers) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const profile = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { plan: true },
  });

  const attempt = await prisma.examAttempt.findUnique({ where: { id: body.attemptId } });
  if (!attempt || attempt.userId !== session.userId) return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  if (attempt.submittedAt) {
    return NextResponse.json({ error: "Attempt already submitted." }, { status: 409 });
  }

  const exam = await prisma.exam.findUnique({ where: { id: attempt.examId } });
  if (!exam) return NextResponse.json({ error: "Exam not found." }, { status: 404 });

  const now = new Date();
  const elapsedSeconds = Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000);
  const allowedSeconds = attempt.allowedSeconds ?? exam.durationMin * 60;
  const isTimeExceeded = elapsedSeconds > allowedSeconds + EXAM_SUBMIT_GRACE_SECONDS;

  const questions = await prisma.questionBank.findMany({
    where: { id: { in: body.answers.map((a) => a.questionId) } },
  });
  const map = new Map(questions.map((q) => [q.id, q.answer]));
  const score = isTimeExceeded
    ? 0
    : body.answers.reduce((acc, item) => (map.get(item.questionId) === item.answer ? acc + 1 : acc), 0);

  const wrongIds: string[] = [];
  if (!isTimeExceeded) {
    for (const item of body.answers) {
      if (map.get(item.questionId) !== item.answer) wrongIds.push(item.questionId);
    }
  }

  const updated = await prisma.examAttempt.update({
    where: { id: attempt.id },
    data: { score, submittedAt: now },
  });
  const submittedAtMs = updated.submittedAt ? updated.submittedAt.getTime() : now.getTime();
  const timeSpentSec = Math.max(0, Math.floor((submittedAtMs - attempt.startedAt.getTime()) / 1000));
  const accuracyPct = updated.maxScore > 0 ? (updated.score / updated.maxScore) * 100 : 0;

  await prisma.studentPerformance
    .create({
      data: {
        studentId: session.userId,
        subject: exam.subject,
        score: accuracyPct,
        weakAreas: accuracyPct < 62 ? [exam.subject] : [],
      },
    })
    .catch(() => undefined);

  let top10: Record<string, unknown> | undefined;
  let trainerDebrief: TrainerDebrief | undefined;

  if (profile?.plan && isTopRankPlan(profile.plan)) {
    trainerDebrief = await updateNexaStudentMemoryAfterExam(session.userId, {
      examId: exam.id,
      subject: exam.subject,
      accuracyPct,
      wrongIds,
    });
  }

  if (attempt.trainingMode === "TOP10") {
    const state = await prisma.top10TrainingState.findUnique({ where: { userId: session.userId } });
    const prevDifficulty = state?.difficulty ?? 2;
    const prevStreak = state?.streakPasses ?? 0;

    const passed = !isTimeExceeded && accuracyPct >= PASS_THRESHOLD_PCT;
    const mustRetry = !passed;

    let nextDifficulty = prevDifficulty;
    let nextStreak = prevStreak;

    if (passed) {
      nextDifficulty = adaptiveDifficulty(accuracyPct, prevDifficulty);
      nextStreak = prevStreak + 1;
    } else {
      nextStreak = 0;
    }

    const weakTopics =
      wrongIds.length > 0
        ? [`${exam.subject} (${wrongIds.length} missed)`]
        : passed
          ? ["Solid round â€” difficulty will adapt up."]
          : ["Time or accuracy below bar â€” tighten fundamentals."];

    await prisma.top10TrainingState.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        phase: "RESULT",
        difficulty: nextDifficulty,
        streakPasses: nextStreak,
        circuitCount: 1,
        lastAttemptId: updated.id,
        lastExamId: exam.id,
        pendingRetry: mustRetry,
        lastWrongQuestionIds: wrongIds,
        lastAccuracyPct: accuracyPct,
        weakTopics,
      },
      update: {
        phase: "RESULT",
        difficulty: nextDifficulty,
        streakPasses: nextStreak,
        circuitCount: { increment: 1 },
        lastAttemptId: updated.id,
        lastExamId: exam.id,
        pendingRetry: mustRetry,
        lastWrongQuestionIds: wrongIds,
        lastAccuracyPct: accuracyPct,
        weakTopics,
      },
    });

    top10 = {
      enabled: true,
      mustRetry,
      accuracyPct,
      weakTopics,
      difficultyNext: nextDifficulty,
      streakPasses: nextStreak,
      passed,
      phase: "RESULT",
      campMessage: mustRetry
        ? "Below camp standard. Mandatory retry â€” no skipping ahead."
        : "Round cleared. Continue to analysis, then drill, then re-test.",
    };
  }

  let weakAreas: string[] = [];
  if (isTimeExceeded) {
    weakAreas = [
      "Time: you exceeded the allowed window â€” pacing, skip strategy, and clock discipline need work.",
    ];
  } else if (wrongIds.length === 0) {
    weakAreas = ["No missed items this round â€” retention on these items looks solid."];
  } else {
    const wrongQs = await prisma.questionBank.findMany({ where: { id: { in: wrongIds } } });
    if (wrongQs.length === 0) {
      weakAreas = [`Missed ${wrongIds.length} item(s) â€” review explanations and rework similar items.`];
    } else {
      const byLevel = new Map<string, number>();
      for (const q of wrongQs) {
        byLevel.set(q.level, (byLevel.get(q.level) ?? 0) + 1);
      }
      weakAreas = [...byLevel.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([level, n]) => `${exam.subject} Â· Level ${level}: ${n} missed`);
    }
  }

  const catalog = await prisma.exam.findMany({ orderBy: { createdAt: "desc" }, take: 80 });
  const sameSubjectAlts = catalog.filter((e) => e.subject === exam.subject && e.id !== exam.id);
  const rotateKey = `${session.userId}:${exam.id}:${wrongIds.join(",")}`;
  const rotate =
    rotateKey.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + Math.floor(accuracyPct);
  const pickedAlt =
    sameSubjectAlts.length > 0 ? sameSubjectAlts[rotate % sameSubjectAlts.length] : null;
  const nextRecommendedExam = pickedAlt
    ? {
        id: pickedAlt.id,
        title: pickedAlt.title,
        subject: pickedAlt.subject,
        durationMin: pickedAlt.durationMin,
        reason: `More ${exam.subject} coverage â€” suggested paper based on weak-area signals from this round.`,
      }
    : {
        id: exam.id,
        title: exam.title,
        subject: exam.subject,
        durationMin: exam.durationMin,
        reason: "Repeat this paper until accuracy stabilizes â€” no dead ends.",
      };

  const trainingLoop = {
    weakAreas,
    retryExamId: exam.id,
    nextRecommendedExam,
  };

  await recordPerformanceAttemptMetrics({
    userId: session.userId,
    attemptId: updated.id,
    examId: exam.id,
    subject: exam.subject,
    accuracyPct,
    timeSpentSec,
    questionIds: body.answers.map((a) => a.questionId),
    wrongIds,
  }).catch(() => undefined);

  return NextResponse.json({
    ok: true,
    score: updated.score,
    maxScore: updated.maxScore,
    accuracyPct,
    timeSpentSec,
    isTimeExceeded,
    wrongQuestionIds: wrongIds,
    trainingLoop,
    ...(trainerDebrief ? { trainerDebrief } : {}),
    ...(top10 ? { top10 } : {}),
  });
}
