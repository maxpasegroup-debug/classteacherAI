/** Submitted exam attempts before we softly suggest RootCare (non-intrusive funnel). */
export const ROOTCARE_EXAM_USAGE_THRESHOLD = 3;

export const ROOTCARE_HEADLINE = "Discover your career path";

export const ROOTCARE_HEADLINE_REPORT = "Turn your assessment into career ideas";

export function advancedRootCareUnlocked(plan: string): boolean {
  return plan === "PRO" || plan === "ELITE" || plan === "TOPRANK";
}
