/** Stored on `User.plan` — align with product tiers. */
export type PlanTier = "BASIC" | "PRO" | "ELITE" | "TOPRANK";

export function isTopRankPlan(plan: string): boolean {
  return plan === "TOPRANK";
}

export function isPaidAiPlan(plan: string): boolean {
  return plan === "PRO" || plan === "ELITE" || plan === "TOPRANK";
}
