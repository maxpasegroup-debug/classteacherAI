import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeConsistencyScoreFromAccuracies } from "@/lib/performance-tracking";
import { buildGrowthInsights, rankPredictionCopy } from "@/lib/student-performance-insights";
import { requireActiveStudentPlan } from "@/lib/student-access";

export const runtime = "nodejs";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function accuracy(score: number, maxScore: number) {
  if (maxScore <= 0) return 0;
  return (score / maxScore) * 100;
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const planGate = await requireActiveStudentPlan(session.userId);
  if (!planGate.ok) {
    return NextResponse.json({ error: planGate.error, code: planGate.code }, { status: 403 });
  }
  const studentPlan = planGate.user.plan;

  const userId = session.userId;

  const [attempts, courseRows, perfMetrics, topicStats, dailySnaps, insightRows, nexaMem] = await Promise.all([
    prisma.examAttempt.findMany({
      where: { userId, submittedAt: { not: null } },
      include: { exam: { select: { title: true, subject: true } } },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.courseProgress.findMany({
      where: { userId },
      include: { course: { select: { title: true, category: true } } },
    }),
    prisma.performanceAttemptMetric.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 120,
      select: {
        accuracyPct: true,
        secondsPerQuestion: true,
        subject: true,
        createdAt: true,
        rankReadinessSnapshot: true,
      },
    }),
    prisma.performanceTopicStat.findMany({ where: { userId } }),
    prisma.performanceDailySnapshot.findMany({
      where: { userId },
      orderBy: { dayKey: "asc" },
      take: 40,
    }),
    prisma.performanceInsightRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
    prisma.nexaStudentMemory.findUnique({
      where: { userId },
      select: { rankReadiness: true },
    }),
  ]);

  if (attempts.length === 0) {
    const skillsAvg =
      courseRows.length > 0 ? courseRows.reduce((a, r) => a + r.progressPct, 0) / courseRows.length : null;

    if (studentPlan === "BASIC") {
      return NextResponse.json({
        tier: "basic" as const,
        summary: {
          overallAccuracyPct: 0,
          totalAttempts: 0,
          streakDays: 0,
        },
      });
    }

    return NextResponse.json({
      summary: {
        overallAccuracyPct: 0,
        totalAttempts: 0,
        weekOverWeekDeltaPct: null,
        streakDays: 0,
        skillsAvgPct: skillsAvg,
      },
      daily: [],
      weeklySeries: [],
      weeklyLabels: [],
      subjects: [],
      weakTopics: [],
      rankPrediction: {
        headline: "Start a mock exam to see how you compare.",
        detail: "We estimate peer standing from practice accuracy across all students.",
        band: "—",
        percentileBeat: null,
      },
      insights: buildGrowthInsights({
        overallAccuracyPct: 0,
        totalAttempts: 0,
        weekOverWeekDeltaPct: null,
        streakDays: 0,
        weakSubjects: [],
        strongestSubject: null,
        skillsAvgPct: skillsAvg,
        percentileBeat: null,
        last7Avg: null,
        prev7Avg: null,
      }),
      advanced: {
        metrics: {
          overallAccuracyPct: 0,
          avgSecondsPerQuestion: null,
          consistencyScore: null,
          topicMasteryAvg: null,
          rankReadiness: nexaMem?.rankReadiness ?? null,
        },
        progressSeries: [] as Array<{
          at: string;
          accuracyPct: number;
          subject: string;
          secondsPerQuestion: number | null;
        }>,
        topicHeatmap: [] as Array<{
          topicKey: string;
          label: string;
          subject: string;
          masteryPct: number;
          answered: number;
        }>,
        dailyImprovement: [] as Array<{
          day: string;
          label: string;
          avgAccuracy: number | null;
          attempts: number;
          consistencyScore: number | null;
          avgSecondsPerQuestion: number | null;
        }>,
        storedInsights: [] as Array<{ message: string; kind: string; createdAt: string }>,
      },
    });
  }

  const accs = attempts.map((a) => accuracy(a.score, a.maxScore));
  const overallAccuracyPct = accs.reduce((s, x) => s + x, 0) / accs.length;

  const now = new Date();
  const msDay = 24 * 60 * 60 * 1000;

  const dailyMap = new Map<string, { sum: number; n: number; count: number }>();
  for (const a of attempts) {
    if (!a.submittedAt) continue;
    const k = dayKey(a.submittedAt);
    const acc = accuracy(a.score, a.maxScore);
    const cur = dailyMap.get(k) ?? { sum: 0, n: 0, count: 0 };
    cur.sum += acc;
    cur.n += 1;
    cur.count += 1;
    dailyMap.set(k, cur);
  }

  const daily: Array<{ day: string; label: string; avgAccuracy: number | null; attempts: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * msDay);
    const k = dayKey(d);
    const bucket = dailyMap.get(k);
    daily.push({
      day: k,
      label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      avgAccuracy: bucket && bucket.n > 0 ? bucket.sum / bucket.n : null,
      attempts: bucket?.count ?? 0,
    });
  }

  const subjectAgg = new Map<string, { sum: number; n: number }>();
  for (const a of attempts) {
    const sub = a.exam.subject || "General";
    const acc = accuracy(a.score, a.maxScore);
    const cur = subjectAgg.get(sub) ?? { sum: 0, n: 0 };
    cur.sum += acc;
    cur.n += 1;
    subjectAgg.set(sub, cur);
  }

  const subjects = [...subjectAgg.entries()]
    .map(([subject, v]) => ({
      subject,
      avgAccuracy: v.sum / v.n,
      attempts: v.n,
      isWeak: v.sum / v.n < 65,
    }))
    .sort((a, b) => a.avgAccuracy - b.avgAccuracy);

  const weakTopics = subjects
    .filter((s) => s.avgAccuracy < 68 && s.attempts >= 1)
    .slice(0, 5)
    .map((s) => ({
      subject: s.subject,
      avgAccuracy: s.avgAccuracy,
      tip: `Schedule 2 short sessions on ${s.subject} before your next full mock.`,
    }));

  const strongest = [...subjectAgg.entries()].sort((a, b) => b[1].sum / b[1].n - a[1].sum / a[1].n)[0]?.[0] ?? null;

  const startLast7 = new Date(now.getTime() - 6 * msDay);
  startLast7.setUTCHours(0, 0, 0, 0);
  const startPrev7 = new Date(startLast7.getTime() - 7 * msDay);

  const inLast7 = attempts.filter((a) => a.submittedAt && a.submittedAt >= startLast7);
  const inPrev7 = attempts.filter(
    (a) => a.submittedAt && a.submittedAt >= startPrev7 && a.submittedAt < startLast7,
  );

  const last7Avg =
    inLast7.length > 0 ? inLast7.reduce((s, a) => s + accuracy(a.score, a.maxScore), 0) / inLast7.length : null;
  const prev7Avg =
    inPrev7.length > 0 ? inPrev7.reduce((s, a) => s + accuracy(a.score, a.maxScore), 0) / inPrev7.length : null;

  const weekOverWeekDeltaPct = last7Avg != null && prev7Avg != null ? last7Avg - prev7Avg : null;

  const weeklyLabels: string[] = [];
  const weeklySeries: (number | null)[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * msDay);
    const k = dayKey(d);
    weeklyLabels.push(d.toLocaleDateString(undefined, { weekday: "short" }));
    const bucket = dailyMap.get(k);
    weeklySeries.push(bucket && bucket.n > 0 ? bucket.sum / bucket.n : null);
  }

  let streakDays = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(now.getTime() - i * msDay);
    const k = dayKey(d);
    if ((dailyMap.get(k)?.count ?? 0) > 0) streakDays += 1;
    else break;
  }

  if (studentPlan === "BASIC") {
    return NextResponse.json({
      tier: "basic" as const,
      summary: {
        overallAccuracyPct,
        totalAttempts: attempts.length,
        streakDays,
      },
      subjects: subjects.slice(0, 8),
    });
  }

  const skillsAvgPct =
    courseRows.length > 0 ? courseRows.reduce((a, r) => a + r.progressPct, 0) / courseRows.length : null;

  let percentileBeat: number | null = null;
  try {
    const rows = await prisma.$queryRaw<{ pct: number }[]>(
      Prisma.sql`
        WITH user_avgs AS (
          SELECT "userId",
            AVG(CASE WHEN "maxScore" > 0 THEN ("score"::float / "maxScore"::float) * 100.0 ELSE 0 END) AS acc
          FROM "ExamAttempt"
          WHERE "submittedAt" IS NOT NULL
          GROUP BY "userId"
        )
        SELECT COALESCE(
          (SELECT COUNT(*)::float FROM user_avgs u2 WHERE u2.acc < ${overallAccuracyPct})
          / NULLIF((SELECT COUNT(*)::float FROM user_avgs), 0) * 100.0,
          0
        ) AS pct
      `,
    );
    percentileBeat = rows[0]?.pct ?? null;
  } catch {
    percentileBeat = null;
  }

  const rp = rankPredictionCopy({
    percentileBeat,
    overallAccuracyPct,
    weakSubjects: weakTopics.map((w) => w.subject),
  });

  const insights = buildGrowthInsights({
    overallAccuracyPct,
    totalAttempts: attempts.length,
    weekOverWeekDeltaPct,
    streakDays,
    weakSubjects: weakTopics.map((w) => w.subject),
    strongestSubject: strongest,
    skillsAvgPct,
    percentileBeat,
    last7Avg,
    prev7Avg,
  });

  const snapByDay = new Map(dailySnaps.map((s) => [s.dayKey, s]));

  const dailyImprovement: Array<{
    day: string;
    label: string;
    avgAccuracy: number | null;
    attempts: number;
    consistencyScore: number | null;
    avgSecondsPerQuestion: number | null;
  }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * msDay);
    const k = dayKey(d);
    const snap = snapByDay.get(k);
    const bucket = dailyMap.get(k);
    dailyImprovement.push({
      day: k,
      label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      avgAccuracy: snap?.avgAccuracy ?? (bucket && bucket.n > 0 ? bucket.sum / bucket.n : null),
      attempts: snap?.attemptCount ?? bucket?.count ?? 0,
      consistencyScore: snap?.consistencyScore ?? null,
      avgSecondsPerQuestion: snap?.avgSecondsPerQuestion ?? null,
    });
  }

  const progressSeries =
    perfMetrics.length > 0
      ? perfMetrics.slice(-45).map((m) => ({
          at: m.createdAt.toISOString(),
          accuracyPct: m.accuracyPct,
          subject: m.subject,
          secondsPerQuestion: m.secondsPerQuestion,
        }))
      : attempts.slice(-45).map((a) => ({
          at: a.submittedAt!.toISOString(),
          accuracyPct: accuracy(a.score, a.maxScore),
          subject: a.exam.subject,
          secondsPerQuestion: null as number | null,
        }));

  const topicHeatmap = topicStats.map((t) => ({
    topicKey: t.topicKey,
    label: t.label,
    subject: t.subject,
    masteryPct: t.answered > 0 ? (t.correct / t.answered) * 100 : 0,
    answered: t.answered,
  }));

  const lastPerfAccs = perfMetrics.slice(-20).map((m) => m.accuracyPct);
  const consistencyScore =
    lastPerfAccs.length >= 2
      ? computeConsistencyScoreFromAccuracies(lastPerfAccs)
      : computeConsistencyScoreFromAccuracies(accs.slice(-20));

  const recentSpq = perfMetrics.slice(-12);
  const avgSecondsPerQuestion =
    recentSpq.length > 0 ? recentSpq.reduce((s, m) => s + m.secondsPerQuestion, 0) / recentSpq.length : null;

  const totAns = topicStats.reduce((s, t) => s + t.answered, 0);
  const topicMasteryAvg =
    totAns > 0
      ? topicStats.reduce((s, t) => s + (t.answered > 0 ? (t.correct / t.answered) * 100 * t.answered : 0), 0) /
        totAns
      : null;

  const rankReadiness =
    nexaMem?.rankReadiness ??
    perfMetrics[perfMetrics.length - 1]?.rankReadinessSnapshot ??
    Math.round(overallAccuracyPct);

  const storedInsights = insightRows.map((r) => ({
    message: r.message,
    kind: r.kind,
    createdAt: r.createdAt.toISOString(),
  }));

  const seenStored = new Set(insightRows.map((r) => r.message));
  const mergedInsights = [...insightRows.map((r) => r.message), ...insights.filter((line) => !seenStored.has(line))].slice(
    0,
    16,
  );

  return NextResponse.json({
    summary: {
      overallAccuracyPct,
      totalAttempts: attempts.length,
      weekOverWeekDeltaPct,
      streakDays,
      skillsAvgPct,
      last7Avg,
      prev7Avg,
    },
    daily,
    weeklySeries,
    weeklyLabels,
    subjects,
    weakTopics,
    rankPrediction: {
      headline: rp.headline,
      detail: rp.detail,
      band: rp.band,
      percentileBeat,
    },
    insights: mergedInsights,
    advanced: {
      metrics: {
        overallAccuracyPct,
        avgSecondsPerQuestion,
        consistencyScore,
        topicMasteryAvg,
        rankReadiness,
      },
      progressSeries,
      topicHeatmap,
      dailyImprovement,
      storedInsights,
    },
  });
}
