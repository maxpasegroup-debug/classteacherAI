import { NextResponse } from "next/server";
import type { Attempt, TrainingState } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateNexaStudentMemoryAfterExam, type TrainerDebrief } from "@/lib/nexa-trainer-memory";
import { recordPerformanceAttemptMetrics } from "@/lib/performance-tracking";
import {
  buildPerformanceAnalysis,
  recordStudentPerformanceSnapshot,
} from "@/lib/rank-intelligence";
import { fetchRankCoachFeedback } from "@/lib/training-coach-nexa";
import { analyzeAndUpsertTrainingState, trainingStateSummary } from "@/lib/training-engine";
import { adaptiveDifficulty, PASS_THRESHOLD_PCT } from "@/lib/top10-training-engine";
import { isTopRankPlan } from "@/lib/plan-tier";

export const runtime = "nodejs";
const EXAM_SUBMIT_GRACE_SECONDS = 10;

function normalizeAnswerKey(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

type SubmitBody = {
  attemptId: string;
  answers: Array<{ questionId: string; answer: string }>;
  timeTakenSec?: number;
};

async function submitBankAttempt(
  session: { userId: string },
  profile: { plan: string } | null,
  bankAttempt: Attempt,
  body: SubmitBody,
) {
  const now = new Date();
  const wallSec = Math.floor((now.getTime() - bankAttempt.createdAt.getTime()) / 1000);
  const allowed = bankAttempt.allowedSeconds ?? 3600;
  const isTimeExceeded = wallSec > allowed + EXAM_SUBMIT_GRACE_SECONDS;

  const idOrder = bankAttempt.questionIds;
  const questions = await prisma.question.findMany({ where: { id: { in: idOrder } } });
  const qById = new Map(questions.map((q) => [q.id, q]));
  const ansMap = new Map(body.answers.map((a) => [a.questionId, a.answer ?? ""]));

  const questionReview: Array<{
    questionId: string;
    isCorrect: boolean;
    selected: string;
    correctAnswer: string;
    explanation: string;
    questionText: string;
    marksAwarded: number;
  }> = [];

  let earned = 0;
  let correctCount = 0;
  const wrongIds: string[] = [];

  for (const qid of idOrder) {
    const q = qById.get(qid);
    if (!q) continue;
    const selected = (ansMap.get(qid) ?? "").trim();
    let ok = false;
    let marksAwarded = 0;
    if (
      !isTimeExceeded &&
      selected.length > 0 &&
      normalizeAnswerKey(selected) === normalizeAnswerKey(q.correctAnswer)
    ) {
      ok = true;
      correctCount += 1;
      earned += q.marks;
      marksAwarded = q.marks;
    } else if (!isTimeExceeded && selected.length > 0) {
      earned -= q.negativeMarks;
      marksAwarded = -q.negativeMarks;
      wrongIds.push(qid);
    } else if (!isTimeExceeded) {
      wrongIds.push(qid);
    }

    questionReview.push({
      questionId: q.id,
      isCorrect: ok,
      selected,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      questionText: q.questionText,
      marksAwarded,
    });
  }

  if (isTimeExceeded) {
    earned = 0;
    correctCount = 0;
    wrongIds.length = 0;
    for (const row of questionReview) {
      row.isCorrect = false;
      row.marksAwarded = 0;
    }
  } else {
    earned = Math.max(0, Math.round(earned));
  }

  const n = questionReview.length;
  const accuracyPct = n > 0 ? (isTimeExceeded ? 0 : (correctCount / n) * 100) : 0;
  const maxMarks = bankAttempt.total;

  const reported = Number(body.timeTakenSec);
  const timeSpentSec =
    Number.isFinite(reported) && reported >= 0 && reported <= wallSec + 30
      ? Math.min(reported, allowed + EXAM_SUBMIT_GRACE_SECONDS)
      : Math.min(wallSec, allowed + EXAM_SUBMIT_GRACE_SECONDS);

  await prisma.$transaction([
    ...questionReview.map((row) =>
      prisma.attemptQuestion.create({
        data: {
          attemptId: bankAttempt.id,
          questionId: row.questionId,
          selected: row.selected,
          isCorrect: row.isCorrect,
        },
      }),
    ),
    prisma.attempt.update({
      where: { id: bankAttempt.id },
      data: {
        score: earned,
        accuracy: accuracyPct,
        timeTaken: timeSpentSec,
        submittedAt: now,
      },
    }),
  ]);

  let weakAreas: string[] = [];
  if (isTimeExceeded) {
    weakAreas = [
      "Time: you exceeded the allowed window — pacing, skip strategy, and clock discipline need work.",
    ];
  } else if (wrongIds.length === 0) {
    weakAreas = ["No missed items this round — retention on these items looks solid."];
  } else {
    const wrongQs = questions.filter((q) => wrongIds.includes(q.id));
    const byTopic = new Map<string, number>();
    for (const q of wrongQs) {
      byTopic.set(q.topic, (byTopic.get(q.topic) ?? 0) + 1);
    }
    weakAreas = [...byTopic.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([topic, c]) => `${bankAttempt.subject} · ${topic}: ${c} missed`);
  }

  const expectedSecondsTotal = questions.reduce((s, q) => s + q.expectedTime, 0);
  const analysisObj = buildPerformanceAnalysis({
    subject: bankAttempt.subject,
    accuracyPct,
    timeSpentSec,
    questionCount: questionReview.length,
    expectedSecondsTotal: expectedSecondsTotal > 0 ? expectedSecondsTotal : null,
    isTimeExceeded,
    weakAreaLines: weakAreas,
  });
  await recordStudentPerformanceSnapshot({
    studentId: session.userId,
    examId: `bank:${bankAttempt.exam}:${bankAttempt.subject}`,
    attemptId: bankAttempt.id,
    subject: bankAttempt.subject,
    score: accuracyPct,
    accuracy: accuracyPct,
    timeTaken: timeSpentSec,
    analysis: analysisObj,
    weakAreas: weakAreas.length > 0 ? weakAreas.slice(0, 16) : accuracyPct < 62 ? [bankAttempt.subject] : [],
    peer: { kind: "bank", exam: bankAttempt.exam, subject: bankAttempt.subject },
  }).catch(() => undefined);

  let trainerDebrief: TrainerDebrief | undefined;
  if (profile?.plan && isTopRankPlan(profile.plan)) {
    trainerDebrief = await updateNexaStudentMemoryAfterExam(session.userId, {
      examId: `bank:${bankAttempt.exam}:${bankAttempt.subject}`,
      subject: bankAttempt.subject,
      accuracyPct,
      wrongIds,
    });
  }

  await recordPerformanceAttemptMetrics({
    userId: session.userId,
    attemptId: bankAttempt.id,
    examId: `question-bank:${bankAttempt.exam}`,
    subject: bankAttempt.subject,
    accuracyPct,
    timeSpentSec,
    questionIds: idOrder,
    wrongIds,
  }).catch(() => undefined);

  let trainingStateRow: TrainingState | null = null;
  try {
    trainingStateRow = await analyzeAndUpsertTrainingState({
      userId: session.userId,
      plan: profile?.plan ?? "BASIC",
      accuracyPct,
      score: earned,
      exam: bankAttempt.exam,
      subject: bankAttempt.subject,
      reviewRows: questionReview.map((r) => ({ questionId: r.questionId, isCorrect: r.isCorrect })),
      questions,
    });
  } catch (err) {
    console.error("TrainingState update:", err);
  }

  const wrongTopicSet = questions.filter((q) => wrongIds.includes(q.id)).map((q) => q.topic);
  const uniqueWrongTopics = [...new Set(wrongTopicSet)];

  const rankCoach = await fetchRankCoachFeedback({
    userId: session.userId,
    plan: profile?.plan ?? "BASIC",
    exam: bankAttempt.exam,
    subject: bankAttempt.subject,
    accuracyPct,
    score: earned,
    maxScore: maxMarks,
    timeSpentSec,
    weakTopicHints: trainingStateRow ? trainingStateSummary(trainingStateRow).topWeak : uniqueWrongTopics.slice(0, 8),
  });

  const catalogExam = await prisma.exam.findFirst({
    where: { subject: bankAttempt.subject },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, subject: true, durationMin: true },
  });
  const examRef = catalogExam ?? {
    id: "",
    title: `${bankAttempt.exam} · ${bankAttempt.subject}`,
    subject: bankAttempt.subject,
    durationMin: 45,
  };

  const trainingLoop = {
    weakAreas,
    retryExamId: examRef.id,
    nextRecommendedExam: {
      id: examRef.id,
      title: examRef.title,
      subject: examRef.subject,
      durationMin: examRef.durationMin,
      reason: `More ${bankAttempt.subject} coverage — continue timed practice from the Exam Engine.`,
    },
  };

  return NextResponse.json({
    ok: true,
    engine: "bank",
    score: earned,
    maxScore: maxMarks,
    accuracyPct,
    timeSpentSec,
    isTimeExceeded,
    wrongQuestionIds: wrongIds,
    questionReview,
    trainingLoop,
    rankCoach,
    trainingSnapshot: trainingStateRow ? trainingStateSummary(trainingStateRow) : undefined,
    ...(trainerDebrief ? { trainerDebrief } : {}),
  });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SubmitBody | null;
  if (!body?.attemptId || !body.answers) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const profile = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { plan: true },
  });

  const bankAttempt = await prisma.attempt.findUnique({ where: { id: body.attemptId } });
  if (bankAttempt) {
    if (bankAttempt.userId !== session.userId) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }
    if (bankAttempt.submittedAt) {
      return NextResponse.json({ error: "Attempt already submitted." }, { status: 409 });
    }
    return submitBankAttempt(session, profile, bankAttempt, body);
  }

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

  let weakAreas: string[] = [];
  if (isTimeExceeded) {
    weakAreas = [
      "Time: you exceeded the allowed window — pacing, skip strategy, and clock discipline need work.",
    ];
  } else if (wrongIds.length === 0) {
    weakAreas = ["No missed items this round — retention on these items looks solid."];
  } else {
    const wrongQs = await prisma.questionBank.findMany({ where: { id: { in: wrongIds } } });
    if (wrongQs.length === 0) {
      weakAreas = [`Missed ${wrongIds.length} item(s) — review explanations and rework similar items.`];
    } else {
      const byLevel = new Map<string, number>();
      for (const q of wrongQs) {
        byLevel.set(q.level, (byLevel.get(q.level) ?? 0) + 1);
      }
      weakAreas = [...byLevel.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([level, n]) => `${exam.subject} · Level ${level}: ${n} missed`);
    }
  }

  const analysisObj = buildPerformanceAnalysis({
    subject: exam.subject,
    accuracyPct,
    timeSpentSec,
    questionCount: body.answers.length,
    expectedSecondsTotal: null,
    isTimeExceeded,
    weakAreaLines: weakAreas,
  });
  await recordStudentPerformanceSnapshot({
    studentId: session.userId,
    examId: exam.id,
    attemptId: updated.id,
    subject: exam.subject,
    score: accuracyPct,
    accuracy: accuracyPct,
    timeTaken: timeSpentSec,
    analysis: analysisObj,
    weakAreas: weakAreas.length > 0 ? weakAreas.slice(0, 16) : accuracyPct < 62 ? [exam.subject] : [],
    peer: { kind: "legacy", catalogExamId: exam.id },
  }).catch(() => undefined);

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
          ? ["Solid round — difficulty will adapt up."]
          : ["Time or accuracy below bar — tighten fundamentals."];

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
        ? "Below camp standard. Mandatory retry — no skipping ahead."
        : "Round cleared. Continue to analysis, then drill, then re-test.",
    };
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
        reason: `More ${exam.subject} coverage — suggested paper based on weak-area signals from this round.`,
      }
    : {
        id: exam.id,
        title: exam.title,
        subject: exam.subject,
        durationMin: exam.durationMin,
        reason: "Repeat this paper until accuracy stabilizes — no dead ends.",
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
