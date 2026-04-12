/** UTC calendar day YYYY-MM-DD */
export function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Consecutive UTC days with at least one submission, counting backward from today.
 */
export function mergedPracticeStreak(submittedAts: Date[]): number {
  const days = new Set(submittedAts.map((d) => utcDayKey(d)));
  const now = new Date();
  const msDay = 24 * 60 * 60 * 1000;
  let streak = 0;
  for (let i = 0; i < 120; i++) {
    const d = new Date(now.getTime() - i * msDay);
    if (days.has(utcDayKey(d))) streak += 1;
    else break;
  }
  return streak;
}

export function countSubmissionsOnUtcDay(submittedAts: Date[], dayKey: string): number {
  return submittedAts.filter((d) => utcDayKey(d) === dayKey).length;
}
