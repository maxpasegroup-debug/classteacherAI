/**
 * Single source of truth for public pricing (INR) and included AI credits.
 * `User.plan` strings: BASIC | PRO | ELITE | TOPRANK.
 */

import { isTopRankPlan } from "@/lib/plan-tier";

export const PLANS = {
  BASIC: {
    key: "BASIC" as const,
    name: "Starter",
    label: "Starter",
    priceInr: 499,
    creditsIncluded: 0,
    aiEnabled: false,
    summary:
      "Limited exam attempts, basic analytics, and full platform UI. No Nexa coaching — upgrade for AI-driven prep.",
  },
  PRO: {
    key: "PRO" as const,
    name: "Pro",
    label: "Pro",
    priceInr: 1999,
    creditsIncluded: 2000,
    aiEnabled: true,
    summary:
      "Full exam system, adaptive tests, limited Nexa AI coaching (credits), performance analytics, and study help.",
  },
  ELITE: {
    key: "ELITE" as const,
    name: "Elite",
    label: "Elite",
    priceInr: 2999,
    creditsIncluded: 8000,
    aiEnabled: true,
    summary: "Higher AI credit pool, full exam system, and advanced analytics — between Pro and TopRank.",
  },
  TOPRANK: {
    key: "TOPRANK" as const,
    name: "TopRank",
    label: "TopRank",
    priceInr: 4999,
    creditsIncluded: 500_000,
    aiEnabled: true,
    summary:
      "Full Nexa AI trainer (hardcore mode), continuous training loop, daily missions, weakness targeting, exam simulations, and rank readiness.",
  },
} as const;

/** User-visible plan name for a stored tier. */
export function subscriptionTierLabel(plan: string): string {
  if (plan === "BASIC") return PLANS.BASIC.name;
  if (plan === "PRO") return PLANS.PRO.name;
  if (plan === "ELITE") return PLANS.ELITE.name;
  if (isTopRankPlan(plan)) return PLANS.TOPRANK.name;
  return plan;
}

/** One-time AI credit top-ups. Requires active paid AI tier — see create-order API. */
export const CREDIT_TOP_UP_PACKS = {
  CREDITS_SMALL: {
    key: "CREDITS_SMALL" as const,
    name: "Starter top-up",
    credits: 100,
    priceInr: 99,
  },
  CREDITS_LARGE: {
    key: "CREDITS_LARGE" as const,
    name: "Value top-up",
    credits: 300,
    priceInr: 249,
  },
} as const;

export const AI_ACCESS_RULES = [
  "Starter: no Nexa AI; use Pro, Elite, or TopRank for coaching.",
  "Pro / Elite: active billing period, AI credits > 0, daily request cap, daily token cap.",
  "TopRank: active billing period; high token allowance with monitoring; no per-request credit deduction.",
] as const;
