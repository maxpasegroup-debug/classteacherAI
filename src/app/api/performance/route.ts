import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPerformanceIntelligence, type PerformanceAnalysisJson } from "@/lib/rank-intelligence";

export const runtime = "nodejs";

/**
 * Rank + snapshot analytics (UI-ready). Complements `/api/students/performance` charts.
 */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const userId = session.userId;

  const [intel, metrics, examCount, bankCount] = await Promise.all([
    getPerformanceIntelligence(userId),
    prisma.performanceAttemptMetric.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 60,
      select: {
        createdAt: true,
        accuracyPct: true,
        secondsPerQuestion: true,
        subject: true,
        examId: true,
      },
    }),
    prisma.examAttempt.count({ where: { userId, submittedAt: { not: null } } }),
    prisma.attempt.count({ where: { userId, submittedAt: { not: null } } }),
  ]);

  const latest = intel.latestSnapshot;
  const recentSpq = metrics.slice(-14);
  const avgSecondsPerQuestion =
    recentSpq.length > 0 ? recentSpq.reduce((s, m) => s + m.secondsPerQuestion, 0) / recentSpq.length : null;

  const overallAccuracyPct =
    latest?.accuracy ??
    latest?.score ??
    (metrics.length > 0 ? metrics[metrics.length - 1]!.accuracyPct : null);

  const emptyAnalysis: PerformanceAnalysisJson = { weakTopics: [], speedIssues: [], accuracyProblems: [] };
  const analysisRaw = latest?.analysis as PerformanceAnalysisJson | null | undefined;
  const analysis: PerformanceAnalysisJson =
    analysisRaw && typeof analysisRaw === "object"
      ? {
          weakTopics: Array.isArray(analysisRaw.weakTopics) ? analysisRaw.weakTopics : [],
          speedIssues: Array.isArray(analysisRaw.speedIssues) ? analysisRaw.speedIssues : [],
          accuracyProblems: Array.isArray(analysisRaw.accuracyProblems) ? analysisRaw.accuracyProblems : [],
        }
      : emptyAnalysis;

  return NextResponse.json({
    success: true,
    overview: {
      rank: latest?.rank ?? null,
      percentile: latest?.percentile ?? null,
      accuracyPct: overallAccuracyPct,
      avgSecondsPerQuestion,
      totalSubmittedAttempts: examCount + bankCount,
      latestSubject: latest?.subject ?? null,
      latestAt: latest?.createdAt.toISOString() ?? null,
    },
    analysis,
    progress: metrics.map((m) => ({
      at: m.createdAt.toISOString(),
      accuracyPct: m.accuracyPct,
      secondsPerQuestion: m.secondsPerQuestion,
      subject: m.subject,
      examId: m.examId,
    })),
    snapshots: intel.snapshots,
    topRank: intel.topRankLoop,
  });
}
