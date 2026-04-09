/** Submitted exam attempts before we softly suggest RootCare (non-intrusive funnel). */
export const ROOTCARE_EXAM_USAGE_THRESHOLD = 3;

export const ROOTCARE_HEADLINE = "Understand your career direction";

export function advancedRootCareUnlocked(plan: string): boolean {
  return plan === "PRO" || plan === "TOP10";
}
