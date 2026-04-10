/** TOP10 Rank Training Engine — rules and copy (server-side). */

export const PASS_THRESHOLD_PCT = 65;
export const SURPRISE_REAL_PROBABILITY = 0.2;
/** Slightly higher when learner has locked a TopRank vision (exam-hall simulations). */
export const SURPRISE_REAL_PROBABILITY_TOPRANK = 0.28;
export const TOP10_QUESTION_CAP = 20;
export const TOP10_QUESTION_MIN = 10;

export type TrainingModeApi = "practice" | "advanced" | "top10" | "standard";

export function utcDayStart(d = new Date()) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export function isSameUtcDay(a: Date, b: Date) {
  return utcDayStart(a).getTime() === utcDayStart(b).getTime();
}

export function adaptiveDifficulty(accuracyPct: number, prev: number): number {
  if (accuracyPct >= 88) return Math.min(5, prev + 1);
  if (accuracyPct >= 72) return prev;
  if (accuracyPct >= 58) return Math.max(1, prev - 1);
  return Math.max(1, prev - 2);
}

export function shouldTriggerSurpriseReal(withVisionBoard = false): boolean {
  const p = withVisionBoard ? SURPRISE_REAL_PROBABILITY_TOPRANK : SURPRISE_REAL_PROBABILITY;
  return Math.random() < p;
}

export function questionCountForDifficulty(tier: number) {
  const n = 10 + tier * 2;
  return Math.min(TOP10_QUESTION_CAP, Math.max(TOP10_QUESTION_MIN, n));
}

/** Rough bucket for QuestionBank.level (string) vs difficulty tier 1–5. */
export function levelMatchesDifficulty(level: string, tier: number): boolean {
  const L = level.toLowerCase().trim();
  const n = parseInt(L, 10);
  if (!Number.isNaN(n)) {
    if (tier <= 2) return n <= 2;
    if (tier === 3) return n >= 2 && n <= 4;
    return n >= 4;
  }
  if (tier <= 2) return /easy|beginner|basic|low/.test(L);
  if (tier >= 4) return /hard|adv|difficult|high/.test(L);
  return true;
}

export function pickDailyChallengeExamId(exams: { id: string }[], userId: string, now = new Date()) {
  if (exams.length === 0) return null;
  const dayOfYear = Math.floor((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86400000);
  const idx = (dayOfYear + userId.length * 7) % exams.length;
  return exams[idx]?.id ?? exams[0].id;
}

export function analysisCopy(weakTopics: string[], accuracyPct: number, difficulty: number) {
  const lines: string[] = [];
  lines.push(
    `Your last round scored ${accuracyPct.toFixed(1)}% at difficulty tier ${difficulty}/5. The camp adjusts every set — no two days feel the same.`,
  );
  if (weakTopics.length > 0) {
    lines.push(`Focus zones: ${weakTopics.join(" · ")}. Next rounds will overweight these patterns until you clear them.`);
  } else {
    lines.push("Strong round — maintain pace; the next set will step up challenge.");
  }
  lines.push("There is no idle state here: after practice, you re-test immediately.");
  return lines;
}

export function practiceCopy(weakTopics: string[]) {
  if (weakTopics.length === 0) {
    return [
      "Drill: 60 seconds — mentally restate the last 3 mistakes you made and the correct rule for each.",
      "Then lock in: one deep breath, and hit Re-test when ready.",
    ];
  }
  return [
    `Drill: write 3 bullet notes on: ${weakTopics[0]?.slice(0, 80) ?? "your weak zone"}.`,
    "No scrolling away — finish the drill, then re-enter the exam loop.",
  ];
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function campHeadline(phase: string) {
  switch (phase) {
    case "RESULT":
      return "Round complete";
    case "ANALYSIS":
      return "Coach analysis";
    case "PRACTICE":
      return "Focused drill";
    case "RETRY":
      return "Mandatory retry";
    default:
      return "TOP10 Training Camp";
  }
}
