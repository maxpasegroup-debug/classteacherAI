import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { parseQuestionOptions } from "@/lib/bank-exam-selection";
import { prisma } from "@/lib/prisma";
import {
  accessDeniedResponse,
  checkUserAccess,
  countExamStartsThisUtcWeek,
} from "@/lib/plan-access";
import { requireStudentFeature } from "@/lib/student-access";
import { createLoopBankAttempt, trainingStateSummary } from "@/lib/training-engine";
import { isTopRankPlan } from "@/lib/plan-tier";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    daily?: boolean;
    exam?: string | null;
    subject?: string | null;
  } | null;

  const gate = await requireStudentFeature(session.userId, "advanced_training");
  if (!gate.ok) {
    if (gate.code === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, upgradeRequired: false, message: gate.error, error: gate.error, code: gate.code },
        { status: 404 },
      );
    }
    return accessDeniedResponse({
      ok: false,
      upgradeRequired: gate.upgradeRequired ?? true,
      message: gate.error,
      code: gate.code,
    });
  }

  const examsThisUtcWeek = await countExamStartsThisUtcWeek(session.userId);
  const examAccess = checkUserAccess(
    {
      plan: gate.user.plan,
      subscriptionStatus: gate.user.subscriptionStatus,
      subscriptionExpiry: gate.user.subscriptionExpiry,
      isTrialActive: gate.user.isTrialActive,
      trialEndsAt: gate.user.trialEndsAt,
    },
    "exam_access",
    { examsThisUtcWeek, nexaMessagesToday: 0 },
  );
  if (!examAccess.ok) {
    return accessDeniedResponse(examAccess);
  }

  const [profile, state] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      select: { exam: true, level: true },
    }),
    prisma.trainingState.findUnique({ where: { userId: session.userId } }),
  ]);

  const examRaw =
    typeof body?.exam === "string" && body.exam.trim().length > 0
      ? body.exam.trim().toUpperCase()
      : state?.lastExam?.trim() || profile?.exam?.trim() || "NEET";

  let subject: string | null =
    typeof body?.subject === "string" && body.subject.trim().length > 0 ? body.subject.trim() : null;
  if (!subject) {
    subject = state?.lastSubject?.trim() || null;
  }
  if (!subject) {
    const firstExam = await prisma.exam.findFirst({
      orderBy: { createdAt: "desc" },
      select: { subject: true },
    });
    subject = firstExam?.subject ?? "Physics";
  }

  let trainingState = state;
  if (!trainingState) {
    const level = profile?.level?.trim() || "Average";
    trainingState = await prisma.trainingState.create({
      data: {
        userId: session.userId,
        level,
        intensity: isTopRankPlan(gate.user.plan) ? "High" : "Medium",
        weakTopics: [] as Prisma.InputJsonValue,
        strongTopics: [] as Prisma.InputJsonValue,
        lastExam: examRaw,
        lastSubject: subject,
      },
    });
  }

  try {
    const { attempt, questions, examRow, deadlineAt, durationSec, mixMeta } = await createLoopBankAttempt({
      userId: session.userId,
      plan: gate.user.plan,
      exam: examRaw,
      subject,
      state: trainingState,
    });

    return NextResponse.json({
      engine: "bank",
      loop: true,
      daily: Boolean(body?.daily),
      attemptId: attempt.id,
      exam: examRow,
      startedAt: attempt.createdAt,
      deadlineAt,
      durationSec,
      questions: questions.map((q) => ({
        id: q.id,
        question: q.questionText,
        options: parseQuestionOptions(q.options),
        marks: q.marks,
      })),
      sessionMeta: {
        timed: true,
        autoEval: true,
        topicFocus: null,
        mixedDifficulty: true,
        questionCount: questions.length,
      },
      trainingMeta: {
        mix: mixMeta,
        topRank: isTopRankPlan(gate.user.plan),
        summary: trainingStateSummary(trainingState),
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_ENOUGH_QUESTIONS") {
      return NextResponse.json(
        {
          error: "Not enough questions in the bank for this exam and subject. Seed questions or pick another paper.",
          code: "EMPTY_BANK",
        },
        { status: 404 },
      );
    }
    console.error("training/next:", e);
    return NextResponse.json({ error: "Could not build training set.", code: "SERVER" }, { status: 500 });
  }
}
