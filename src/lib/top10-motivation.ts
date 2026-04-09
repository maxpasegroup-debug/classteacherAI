/** Rotating copy for TOP10 elite training UI — short, minimal distraction. */
export const TOP10_MOTIVATIONS = [
  "Discipline today is rank tomorrow.",
  "One clean round beats ten careless ones.",
  "Your edge is built in reps, not luck.",
  "Stay in the loop — momentum compounds.",
  "Calm under the clock is a skill you can train.",
  "Small gains stack into leaderboard moves.",
  "Focus beats talent when talent doesn’t show up.",
  "Finish strong — the next circuit is easier mentally.",
];

export function pickMotivation(seed: {
  phase: string;
  circuitCount: number;
  streakPasses: number;
  questionIndex: number;
}): string {
  const n =
    seed.phase.length * 11 +
    seed.circuitCount * 17 +
    seed.streakPasses * 23 +
    seed.questionIndex * 7;
  return TOP10_MOTIVATIONS[Math.abs(n) % TOP10_MOTIVATIONS.length] ?? TOP10_MOTIVATIONS[0];
}
