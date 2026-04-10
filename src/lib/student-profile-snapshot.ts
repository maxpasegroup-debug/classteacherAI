/** Aggregate exam stats for student profile / identity surfaces. */

type AttemptRow = {
  submittedAt: Date | null;
  score: number;
  maxScore: number;
};

function dayKeyUtc(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function computeAttemptStats(attempts: AttemptRow[]) {
  const submitted = attempts.filter((a) => a.submittedAt);
  const accs = submitted.map((a) => (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0));
  const avgAccuracyPct = accs.length > 0 ? accs.reduce((s, x) => s + x, 0) / accs.length : null;

  const dailyMap = new Map<string, boolean>();
  for (const a of submitted) {
    dailyMap.set(dayKeyUtc(a.submittedAt!), true);
  }

  const now = new Date();
  const msDay = 24 * 60 * 60 * 1000;
  let streakDays = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date(now.getTime() - i * msDay);
    if (dailyMap.get(dayKeyUtc(d))) streakDays += 1;
    else break;
  }

  return {
    totalAttempts: submitted.length,
    avgAccuracyPct,
    streakDays,
  };
}
