import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countSubmissionsOnUtcDay, mergedPracticeStreak, utcDayKey } from "@/lib/practice-streak";

export const runtime = "nodejs";

const DAILY_EXAM_TARGET = 1;

/**
 * Single payload for student home dashboard (mission, streak, rank snapshot, nudges).
 */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const userId = session.userId;
  const todayKey = utcDayKey(new Date());

  const [
    examSubs,
    bankSubs,
    rankSnaps,
    profile,
    lastLegacyAttempt,
    lastBankAttempt,
    examScores,
    bankScores,
  ] = await Promise.all([
    prisma.examAttempt.findMany({
      where: { userId, submittedAt: { not: null } },
      select: { submittedAt: true },
    }),
    prisma.attempt.findMany({
      where: { userId, submittedAt: { not: null } },
      select: { submittedAt: true },
    }),
    prisma.studentPerformance.findMany({
      where: { studentId: userId, attemptId: { not: null }, rank: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        rank: true,
        percentile: true,
        accuracy: true,
        score: true,
        subject: true,
        createdAt: true,
        analysis: true,
      },
    }),
    prisma.studentProfile.findUnique({
      where: { userId },
      select: { exam: true, targetRank: true },
    }),
    prisma.examAttempt.findFirst({
      where: { userId, submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      include: { exam: { select: { title: true } } },
    }),
    prisma.attempt.findFirst({
      where: { userId, submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      select: { exam: true, subject: true, mode: true, submittedAt: true },
    }),
    prisma.examAttempt.findMany({
      where: { userId, submittedAt: { not: null } },
      take: 80,
      select: { score: true, maxScore: true },
    }),
    prisma.attempt.findMany({
      where: { userId, submittedAt: { not: null } },
      take: 80,
      select: { score: true, total: true, accuracy: true },
    }),
  ]);

  const legacyMs = lastLegacyAttempt?.submittedAt?.getTime() ?? 0;
  const bankMs = lastBankAttempt?.submittedAt?.getTime() ?? 0;
  let lastAttempt: { title: string; submittedAt: string } | null = null;
  if (legacyMs >= bankMs && lastLegacyAttempt?.exam?.title && lastLegacyAttempt.submittedAt) {
    lastAttempt = {
      title: lastLegacyAttempt.exam.title,
      submittedAt: lastLegacyAttempt.submittedAt.toISOString(),
    };
  } else if (bankMs > legacyMs && lastBankAttempt?.submittedAt) {
    lastAttempt = {
      title: `${lastBankAttempt.exam} · ${lastBankAttempt.subject} (${lastBankAttempt.mode})`,
      submittedAt: lastBankAttempt.submittedAt.toISOString(),
    };
  }

  const allDates = [
    ...examSubs.map((e) => e.submittedAt!),
    ...bankSubs.map((b) => b.submittedAt!),
  ];
  const streakDays = mergedPracticeStreak(allDates);
  const todaySubmitted = countSubmissionsOnUtcDay(allDates, todayKey);
  const progressPct = Math.min(100, Math.round((todaySubmitted / DAILY_EXAM_TARGET) * 100));

  const latest = rankSnaps[0] ?? null;
  const prev = rankSnaps[1] ?? null;
  const peerRank = latest?.rank ?? null;
  const percentile = latest?.percentile ?? null;

  const analysis = latest?.analysis as { weakTopics?: string[] } | null | undefined;
  const weakHints = Array.isArray(analysis?.weakTopics)
    ? analysis!.weakTopics!.slice(0, 3)
    : [];

  const accParts: number[] = [
    ...examScores.map((a) => (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0)),
    ...bankScores.map((a) => (a.accuracy > 0 ? a.accuracy : a.total > 0 ? (a.score / a.total) * 100 : 0)),
  ];
  const overallAccuracyPct = accParts.length > 0 ? accParts.reduce((s, x) => s + x, 0) / accParts.length : null;

  const notifications: string[] = [];
  if (todaySubmitted === 0) {
    notifications.push("You missed today's training — log one exam to stay on track.");
  } else if (todaySubmitted < DAILY_EXAM_TARGET) {
    notifications.push(`${DAILY_EXAM_TARGET - todaySubmitted} more exam(s) to hit today's target.`);
  }
  if (peerRank != null && prev?.rank != null && peerRank > prev.rank) {
    notifications.push("Your rank dropped since last round — focused reps help.");
  }
  if (notifications.length < 2) {
    notifications.push("Keep the loop: exam → debrief → next challenge.");
  }

  const rankDeltaVsLast =
    latest?.rank != null && prev?.rank != null ? prev.rank - latest.rank : null;

  return NextResponse.json({
    success: true,
    mission: {
      dailyExamTarget: DAILY_EXAM_TARGET,
      todaySubmitted,
      progressPct,
      label: todaySubmitted >= DAILY_EXAM_TARGET ? "Daily target met" : `${DAILY_EXAM_TARGET - todaySubmitted} exam(s) to go today`,
    },
    streak: { days: streakDays, label: streakDays > 0 ? `${streakDays} day streak` : "Start your streak" },
    rank: {
      peerRank,
      percentile,
      /** Positive = improved (lower rank number is better). */
      rankDeltaVsLast,
      lastSubject: latest?.subject ?? null,
      overallAccuracyPct,
    },
    weakAreas: weakHints,
    targetExam: profile?.exam ?? null,
    targetRankLabel: profile?.targetRank ?? null,
    lastAttempt,
    notifications: notifications.slice(0, 3),
  });
}
