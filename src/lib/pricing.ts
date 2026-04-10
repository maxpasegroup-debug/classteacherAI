/**
 * Single source of truth for public pricing (INR) and included AI credits.
 * DB enum stays BASIC / PRO / TOP10; user-facing names are Starter / Pro / TopRank.
 * Access rules: `applyPlanExpiry` + `assertCanUseAi` / Nexa branching in `@/lib/billing`.
 */

import type { SubscriptionPlan } from "@prisma/client";

export const PLANS = {
  BASIC: {
    key: "BASIC" as const,
    name: "Starter",
    label: "Starter",
    /** Paid entry tier: limited attempts, basic analytics, platform UI. */
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
  TOP10: {
    key: "TOP10" as const,
    name: "TopRank",
    label: "TopRank",
    priceInr: 4999,
    creditsIncluded: 500_000,
    aiEnabled: true,
    summary:
      "Full Nexa AI trainer (hardcore mode), continuous training loop, daily missions, weakness targeting, exam simulations, and rank readiness.",
  },
} as const;

/** User-visible plan name for a DB tier. */
export function subscriptionTierLabel(plan: SubscriptionPlan): string {
  if (plan === "BASIC") return PLANS.BASIC.name;
  if (plan === "PRO") return PLANS.PRO.name;
  return PLANS.TOP10.name;
}

/** One-time AI credit top-ups. Requires active PRO or TOP10 — see create-order API. */
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
  "Starter: no Nexa AI for teachers or students; use Pro or TopRank for coaching.",
  "Pro: active billing period, AI credits > 0, daily request cap, daily token cap.",
  "TopRank: active billing period; high token allowance with monitoring; no per-request credit deduction.",
] as const;
