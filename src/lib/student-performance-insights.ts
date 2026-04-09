/** Rule-based “AI-style” copy from computed stats (no LLM cost). */

export type PerformanceSummaryInput = {
  overallAccuracyPct: number;
  totalAttempts: number;
  weekOverWeekDeltaPct: number | null;
  streakDays: number;
  weakSubjects: string[];
  strongestSubject: string | null;
  skillsAvgPct: number | null;
  percentileBeat: number | null;
  last7Avg: number | null;
  prev7Avg: number | null;
};

export function buildGrowthInsights(input: PerformanceSummaryInput): string[] {
  const lines: string[] = [];

  if (input.totalAttempts === 0) {
    return [
      "Complete a practice exam to unlock your growth dashboard — every attempt builds your learning curve.",
      "Skills courses and mock tests both count toward clearer strengths and gaps.",
    ];
  }

  lines.push(
    `You've completed ${input.totalAttempts} practice attempt${input.totalAttempts === 1 ? "" : "s"} with an overall accuracy of ${input.overallAccuracyPct.toFixed(1)}%.`,
  );

  if (input.streakDays >= 1) {
    lines.push(
      `Nice momentum — ${input.streakDays} day${input.streakDays === 1 ? "" : "s"} in a row with activity. Consistency is one of the strongest predictors of exam success.`,
    );
  }

  if (input.weekOverWeekDeltaPct != null && Math.abs(input.weekOverWeekDeltaPct) >= 2) {
    if (input.weekOverWeekDeltaPct > 0) {
      lines.push(
        `Your last 7 days are about ${input.weekOverWeekDeltaPct.toFixed(1)} percentage points stronger than the week before — that's visible progress.`,
      );
    } else {
      lines.push(
        `Last week's average dipped slightly (${input.weekOverWeekDeltaPct.toFixed(1)} pts vs the prior week). Short plateaus are normal — focus on one weak topic this week.`,
      );
    }
  } else if (input.last7Avg != null && input.prev7Avg != null) {
    lines.push("Your weekly averages are steady — try one timed mock to push into the next accuracy band.");
  }

  if (input.weakSubjects.length > 0) {
    lines.push(
      `Priority focus: ${input.weakSubjects.slice(0, 2).join(", ")} — short, targeted drills here often lift overall rank fastest.`,
    );
  }

  if (input.strongestSubject) {
    lines.push(
      `${input.strongestSubject} is a strength — use quick revision here to free time for harder topics.`,
    );
  }

  if (input.skillsAvgPct != null && input.skillsAvgPct > 0) {
    lines.push(
      `Your skills courses sit around ${input.skillsAvgPct.toFixed(0)}% completion on average — finishing modules reinforces exam-style thinking.`,
    );
  }

  if (input.percentileBeat != null && input.percentileBeat > 0) {
    lines.push(
      `By average mock score, you're ahead of about ${input.percentileBeat.toFixed(0)}% of learners — keep the rhythm to convert that into leaderboard gains.`,
    );
  }

  return lines.slice(0, 8);
}

export function rankPredictionCopy(input: {
  percentileBeat: number | null;
  overallAccuracyPct: number;
  weakSubjects: string[];
}): { headline: string; detail: string; band: string } {
  const { percentileBeat, overallAccuracyPct, weakSubjects } = input;

  let band = "Building momentum";
  if (percentileBeat != null) {
    if (percentileBeat >= 66) band = "Top third potential";
    else if (percentileBeat >= 33) band = "Middle pack → top half";
    else band = "Early stage — high upside";
  }

  const headline =
    percentileBeat != null
      ? `You're trending ahead of roughly ${percentileBeat.toFixed(0)}% of peers by practice accuracy.`
      : "Keep logging attempts — we'll refine rank estimates as your history grows.";

  const target = weakSubjects[0] ?? "your next weak area";
  const detail =
    overallAccuracyPct >= 75
      ? `Sustaining ${overallAccuracyPct.toFixed(0)}%+ with occasional timed tests often correlates with top-quartile finishes. Push ${target} to lock in gains.`
      : `Raising overall accuracy toward ~70–80% typically moves leaderboard position quickly. Next win: tighten ${target} with 20-minute focused drills.`;

  return { headline, detail, band };
}
