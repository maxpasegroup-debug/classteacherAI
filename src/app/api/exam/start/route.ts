import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { BASIC_EXAM_STARTS_PER_DAY } from "@/lib/billing";
import { pickMixedDifficultyQuestions } from "@/lib/exam-question-selection";
import { prisma } from "@/lib/prisma";
import { requireStudentFeature } from "@/lib/student-access";
import {
  isSameUtcDay,
  levelMatchesDifficulty,
  pickDailyChallengeExamId,
  questionCountForDifficulty,
  shouldTriggerSurpriseReal,
  shuffle,
  utcDayStart,
  type TrainingModeApi,
} from "@/lib/top10-training-engine";
import { isTopRankPlan } from "@/lib/plan-tier";

export const runtime = "nodejs";

async function getOrCreateTop10State(userId: string) {
  const existing = await prisma.top10TrainingState.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.top10TrainingState.create({
    data: {
      userId,
      phase: "EXAM",
      difficulty: 2,
    },
  });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    examId?: string;
    trainingMode?: TrainingModeApi;
    /** Optional keyword â€” questions whose text contains it (topic drill). */
    topicFocus?: string | null;
    /** Sample across easy / medium / hard levels. */
    mixedDifficulty?: boolean;
  } | null;

  const trainingMode: TrainingModeApi = body?.trainingMode ?? "standard";

  if (trainingMode === "top10") {
    const gate = await requireStudentFeature(session.userId, "top10_training");
    if (!gate.ok) {
      const status =
        gate.code === "EXPIRED" || gate.code === "SUBSCRIPTION" ? 403 : gate.code === "PLAN" ? 403 : 400;
      return NextResponse.json({ error: gate.error, code: gate.code }, { status });
    }

    const exams = await prisma.exam.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
    if (exams.length === 0) {
      return NextResponse.json({ error: "No exams configured.", code: "EMPTY" }, { status: 404 });
    }

    let state = await getOrCreateTop10State(session.userId);
    const now = new Date();

    let examId = body?.examId ?? null;
    let dailyChallenge = false;

    if (!examId) {
      if (state.pendingRetry && state.lastExamId) {
        examId = state.lastExamId;
      } else {
        const needsDaily = !state.dailyChallengeDate || !isSameUtcDay(state.dailyChallengeDate, now);
        if (needsDaily) {
          examId = pickDailyChallengeExamId(exams, session.userId, now);
          dailyChallenge = true;
          state = await prisma.top10TrainingState.update({
            where: { userId: session.userId },
            data: { dailyChallengeDate: utcDayStart(now) },
          });
        } else {
          examId = exams[Math.floor(Math.random() * exams.length)]!.id;
        }
      }
    }

    if (!examId) {
      return NextResponse.json({ error: "Could not assign an exam for TOP10 training." }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return NextResponse.json({ error: "Exam not found." }, { status: 404 });

    const hasVision = Boolean(
      await prisma.topRankVisionBoard.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      }),
    );
    const surpriseReal = shouldTriggerSurpriseReal(hasVision);

    const tier = state.difficulty;
    const targetCount = questionCountForDifficulty(tier);

    const pool = await prisma.questionBank.findMany({
      where: { subject: exam.subject },
    });

    const wrongPref = state.lastWrongQuestionIds ?? [];
    const tierPool = pool.filter((q) => levelMatchesDifficulty(q.level, tier));
    const base = tierPool.length >= 8 ? tierPool : pool;

    const prefer = base.filter((q) => wrongPref.includes(q.id));
    const rest = base.filter((q) => !wrongPref.includes(q.id));
    let questions = shuffle([...prefer, ...shuffle(rest)]).slice(0, targetCount);

    if (questions.length === 0) {
      questions = shuffle([...pool]).slice(0, Math.min(targetCount, pool.length));
    }

    let durationSec = exam.durationMin * 60;
    if (surpriseReal) {
      durationSec = Math.floor(durationSec * 0.85);
    }

    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        userId: session.userId,
        maxScore: questions.length,
        trainingMode: "TOP10",
        surpriseReal,
        dailyChallenge,
        allowedSeconds: durationSec,
      },
    });

    const deadlineAt = new Date(attempt.startedAt.getTime() + durationSec * 1000);

    await prisma.top10TrainingState.update({
      where: { userId: session.userId },
      data: {
        phase: "EXAM",
        lastExamId: exam.id,
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      exam,
      startedAt: attempt.startedAt,
      deadlineAt,
      durationSec,
      questions: questions.map((q) => ({ id: q.id, question: q.question, options: q.options })),
      trainingMeta: {
        trainingMode: "top10" as const,
        surpriseReal,
        dailyChallenge,
        difficulty: tier,
        circuitCount: state.circuitCount,
      },
      sessionMeta: {
        timed: true,
        autoEval: true,
        topicFocus: null,
        mixedDifficulty: true,
        questionCount: questions.length,
      },
    });
  }

  const gate = await requireStudentFeature(session.userId, "exam_start");
  if (!gate.ok) {
    const status =
      gate.code === "EXPIRED" || gate.code === "SUBSCRIPTION" ? 403 : gate.code === "PLAN" ? 403 : 400;
    return NextResponse.json({ error: gate.error, code: gate.code }, { status });
  }

  if (gate.user.plan === "BASIC") {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const startsToday = await prisma.examAttempt.count({
      where: { userId: session.userId, startedAt: { gte: startOfDay } },
    });
    if (startsToday >= BASIC_EXAM_STARTS_PER_DAY) {
      return NextResponse.json(
        { error: "Daily exam limit reached on Basic. Upgrade for unlimited practice.", code: "RATE_LIMIT" },
        { status: 429 },
      );
    }
  }

  if (!body?.examId) return NextResponse.json({ error: "examId required." }, { status: 400 });

  const exam = await prisma.exam.findUnique({ where: { id: body.examId } });
  if (!exam) return NextResponse.json({ error: "Exam not found." }, { status: 404 });

  const topicRaw = typeof body?.topicFocus === "string" ? body.topicFocus.trim() : "";
  const topicFocus = topicRaw.length > 0 ? topicRaw : null;
  const mixedDifficulty = Boolean(body?.mixedDifficulty);

  const order: "asc" | "desc" = trainingMode === "practice" ? "asc" : "desc";
  const targetCount = trainingMode === "practice" ? 15 : 18;

  const focusedWhere: Prisma.QuestionBankWhereInput = { subject: exam.subject };
  if (topicFocus) {
    focusedWhere.OR = [
      { question: { contains: topicFocus, mode: "insensitive" } },
      { explanation: { contains: topicFocus, mode: "insensitive" } },
    ];
  }

  let pool = await prisma.questionBank.findMany({
    where: focusedWhere,
    take: 120,
    orderBy: { createdAt: order },
  });

  if (topicFocus && pool.length < 5) {
    pool = await prisma.questionBank.findMany({
      where: { subject: exam.subject },
      take: 120,
      orderBy: { createdAt: order },
    });
  }

  let questions =
    mixedDifficulty && pool.length > 0
      ? pickMixedDifficultyQuestions(pool, Math.min(targetCount, pool.length))
      : pool.slice(0, Math.min(targetCount, pool.length));

  if (questions.length === 0) {
    const fallback = await prisma.questionBank.findMany({
      where: { subject: exam.subject },
      take: Math.min(targetCount, 40),
      orderBy: { createdAt: order },
    });
    questions = mixedDifficulty
      ? pickMixedDifficultyQuestions(fallback, Math.min(targetCount, fallback.length))
      : fallback;
  }

  const modeUpper =
    trainingMode === "practice" ? "PRACTICE" : trainingMode === "advanced" ? "ADVANCED" : null;

  const durationSec = exam.durationMin * 60;
  const attempt = await prisma.examAttempt.create({
    data: {
      examId: exam.id,
      userId: session.userId,
      maxScore: questions.length,
      trainingMode: modeUpper,
      allowedSeconds: durationSec,
    },
  });
  const deadlineAt = new Date(attempt.startedAt.getTime() + durationSec * 1000);

  return NextResponse.json({
    attemptId: attempt.id,
    exam,
    startedAt: attempt.startedAt,
    deadlineAt,
    durationSec,
    questions: questions.map((q) => ({ id: q.id, question: q.question, options: q.options })),
    trainingMeta: modeUpper ? { trainingMode, difficulty: isTopRankPlan(gate.user.plan) ? 3 : 2 } : undefined,
    sessionMeta: {
      timed: true,
      autoEval: true,
      topicFocus,
      mixedDifficulty,
      questionCount: questions.length,
    },
  });
}
