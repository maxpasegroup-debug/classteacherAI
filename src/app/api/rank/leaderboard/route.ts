import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildRankedList,
  dailyWindow,
  findUserRank,
  globalWindow,
  topN,
  weeklyWindow,
  type RankedUser,
} from "@/lib/rank-system";

export const runtime = "nodejs";

const TOP_N = 10;

function serializeRow(
  r: RankedUser,
  names: Map<string, string>,
): {
  rank: number;
  name: string;
  compositeScore: number;
  avgAccuracy: number;
  avgSecondsPerQuestion: number;
  speedScore: number;
  consistency: number;
} {
  return {
    rank: r.rank,
    name: names.get(r.userId) ?? "Learner",
    compositeScore: Math.round(r.compositeScore * 10) / 10,
    avgAccuracy: Math.round(r.avgAccuracy * 10) / 10,
    avgSecondsPerQuestion: Math.round(r.avgSecondsPerQuestion * 10) / 10,
    speedScore: Math.round(r.speedScore * 10) / 10,
    consistency: Math.round(r.consistency * 10) / 10,
  };
}

function scopePayload(ranked: RankedUser[], viewerId: string, names: Map<string, string>) {
  const top10 = topN(ranked, TOP_N).map((r) => serializeRow(r, names));
  const mine = findUserRank(ranked, viewerId);
  return {
    top10,
    yourRank: mine?.rank ?? null,
    yourScore: mine != null ? Math.round(mine.entry.compositeScore * 10) / 10 : null,
    totalRanked: ranked.length,
    breakdown: mine
      ? {
          avgAccuracy: Math.round(mine.entry.avgAccuracy * 10) / 10,
          avgSecondsPerQuestion: Math.round(mine.entry.avgSecondsPerQuestion * 10) / 10,
          speedScore: Math.round(mine.entry.speedScore * 10) / 10,
          consistency: Math.round(mine.entry.consistency * 10) / 10,
        }
      : null,
  };
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const viewerId = session.userId;
  const win = globalWindow();

  const attempts = await prisma.examAttempt.findMany({
    where: {
      submittedAt: { not: null, gte: win.start },
    },
    select: {
      userId: true,
      score: true,
      maxScore: true,
      startedAt: true,
      submittedAt: true,
    },
  });

  const rankedDaily = buildRankedList(attempts, dailyWindow());
  const rankedWeekly = buildRankedList(attempts, weeklyWindow());
  const rankedGlobal = buildRankedList(attempts, win);

  const needIds = new Set<string>([viewerId]);
  for (const r of rankedDaily.slice(0, TOP_N)) needIds.add(r.userId);
  for (const r of rankedWeekly.slice(0, TOP_N)) needIds.add(r.userId);
  for (const r of rankedGlobal.slice(0, TOP_N)) needIds.add(r.userId);

  const users = await prisma.user.findMany({
    where: { id: { in: [...needIds] } },
    select: { id: true, name: true },
  });
  const names = new Map(users.map((u) => [u.id, u.name]));

  return NextResponse.json({
    label: "TOP10 Achievers",
    formula: "Composite = 45% accuracy + 30% speed (vs peers) + 25% consistency",
    daily: scopePayload(rankedDaily, viewerId, names),
    weekly: scopePayload(rankedWeekly, viewerId, names),
    global: scopePayload(rankedGlobal, viewerId, names),
  });
}
