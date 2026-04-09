import { computeConsistencyScoreFromAccuracies } from "@/lib/performance-tracking";

export type RankWindow = "daily" | "weekly" | "global";

export type AttemptRow = {
  userId: string;
  score: number;
  maxScore: number;
  startedAt: Date;
  submittedAt: Date | null;
};

/** UTC midnight today through now. */
export function dailyWindow(now = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  return { start, end: now };
}

/** Rolling last 7 days. */
export function weeklyWindow(now = new Date()): { start: Date; end: Date } {
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { start, end: now };
}

/** Rolling last 365 days (global leaderboard period). */
export function globalWindow(now = new Date()): { start: Date; end: Date } {
  const start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  return { start, end: now };
}

export function windowFor(scope: RankWindow, now = new Date()) {
  if (scope === "daily") return dailyWindow(now);
  if (scope === "weekly") return weeklyWindow(now);
  return globalWindow(now);
}

type UserAgg = {
  userId: string;
  accuracies: number[];
  secondsPerQuestion: number[];
};

function aggregateByUser(attempts: AttemptRow[], win: { start: Date; end: Date }): Map<string, UserAgg> {
  const map = new Map<string, UserAgg>();
  for (const a of attempts) {
    if (!a.submittedAt) continue;
    if (a.submittedAt < win.start || a.submittedAt > win.end) continue;
    const acc = a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
    const sec = Math.max(0, (a.submittedAt.getTime() - a.startedAt.getTime()) / 1000);
    const spq = a.maxScore > 0 ? sec / a.maxScore : 0;
    const cur = map.get(a.userId) ?? { userId: a.userId, accuracies: [], secondsPerQuestion: [] };
    cur.accuracies.push(acc);
    cur.secondsPerQuestion.push(spq);
    map.set(a.userId, cur);
  }
  return map;
}

export type RankedUser = {
  userId: string;
  rank: number;
  compositeScore: number;
  avgAccuracy: number;
  avgSecondsPerQuestion: number;
  speedScore: number;
  consistency: number;
};

const W_ACC = 0.45;
const W_SPEED = 0.3;
const W_CONS = 0.25;

/**
 * Composite score: accuracy (45%) + speed vs cohort (30%) + consistency (25%).
 * Higher is better. Speed uses inverted min–max normalization (faster = higher).
 */
export function buildRankedList(attempts: AttemptRow[], win: { start: Date; end: Date }): RankedUser[] {
  const byUser = aggregateByUser(attempts, win);
  const rows: Omit<RankedUser, "rank">[] = [];

  for (const [, u] of byUser) {
    if (u.accuracies.length === 0) continue;
    const avgAcc = u.accuracies.reduce((s, x) => s + x, 0) / u.accuracies.length;
    const avgSpq =
      u.secondsPerQuestion.length > 0
        ? u.secondsPerQuestion.reduce((s, x) => s + x, 0) / u.secondsPerQuestion.length
        : 0;
    const cons =
      computeConsistencyScoreFromAccuracies(u.accuracies) ??
      Math.min(100, Math.max(0, avgAcc));
    rows.push({
      userId: u.userId,
      compositeScore: 0,
      avgAccuracy: avgAcc,
      avgSecondsPerQuestion: avgSpq,
      speedScore: 0,
      consistency: cons,
    });
  }

  const spqs = rows.map((r) => r.avgSecondsPerQuestion);
  const minSpq = spqs.length ? Math.min(...spqs) : 0;
  const maxSpq = spqs.length ? Math.max(...spqs) : 1;
  const range = Math.max(maxSpq - minSpq, 1e-6);

  for (const r of rows) {
    r.speedScore = 100 * (1 - (r.avgSecondsPerQuestion - minSpq) / range);
    r.compositeScore = W_ACC * r.avgAccuracy + W_SPEED * r.speedScore + W_CONS * r.consistency;
  }

  rows.sort((a, b) => b.compositeScore - a.compositeScore);

  return rows.map((r, i) => ({
    ...r,
    rank: i + 1,
  }));
}

export function topN(ranked: RankedUser[], n: number): RankedUser[] {
  return ranked.slice(0, n);
}

export function findUserRank(ranked: RankedUser[], userId: string): { rank: number; entry: RankedUser } | null {
  const idx = ranked.findIndex((r) => r.userId === userId);
  if (idx < 0) return null;
  return { rank: ranked[idx]!.rank, entry: ranked[idx]! };
}
