import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { accessDeniedResponse, checkUserAccess } from "@/lib/plan-access";
import { buildDailyTrainingTask, trainingStateSummary } from "@/lib/training-engine";

export const runtime = "nodejs";

/**
 * Daily rank-training directive from TrainingState + weak topics (no AI credits).
 */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await applyPlanExpiry(session.userId);

  const [profile, state, user] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      select: { exam: true },
    }),
    prisma.trainingState.findUnique({ where: { userId: session.userId } }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { plan: true, subscriptionStatus: true, subscriptionExpiry: true },
    }),
  ]);

  if (!user) {
    return NextResponse.json(
      { success: false, upgradeRequired: false, message: "User not found.", error: "User not found.", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const trainingAccess = checkUserAccess(
    {
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry,
    },
    "advanced_training",
    { examsThisUtcWeek: 0, nexaMessagesToday: 0 },
  );
  if (!trainingAccess.ok) {
    return accessDeniedResponse(trainingAccess);
  }

  const exam = state?.lastExam?.trim() || profile?.exam?.trim() || "NEET";
  const subject = state?.lastSubject?.trim() || "Physics";
  const plan = user.plan;

  const summary = state ? trainingStateSummary(state) : null;
  const { task, continuousPush } = buildDailyTrainingTask({
    plan,
    exam,
    subject,
    topWeak: summary?.topWeak ?? [],
    focusMode: summary?.focusMode ?? false,
    focusTopic: summary?.focusTopic,
  });

  return NextResponse.json({
    task,
    continuousPush,
    exam,
    subject,
    trainingState: summary,
  });
}
