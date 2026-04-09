/**
 * Single source of truth for public pricing (INR) and included AI credits.
 * Access rules: `applyPlanExpiry` + `assertCanUseAi` / Nexa branching in `@/lib/billing`.
 */

export const PLANS = {
  BASIC: {
    key: "BASIC" as const,
    name: "Basic",
    label: "Basic",
    /** After 30-day trial, monthly Basic access (exam + basic reports). */
    priceInr: 199,
    creditsIncluded: 0,
    aiEnabled: false,
    summary: "30-day trial, then ₹199/mo. Limited exam practice and basic reports. No Nexa AI — upgrade for AI.",
  },
  PRO: {
    key: "PRO" as const,
    name: "Pro",
    label: "Pro",
    priceInr: 499,
    creditsIncluded: 1000,
    aiEnabled: true,
    summary: "Controlled AI via credits. Exams, study help, Nexa, and performance analytics.",
  },
  TOP10: {
    key: "TOP10" as const,
    name: "TOP10",
    label: "TOP10",
    priceInr: 4999,
    creditsIncluded: 500_000,
    aiEnabled: true,
    summary: "Full AI pool, TOP10 training, advanced analytics, and daily challenges.",
  },
} as const;

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
  "BASIC: no Nexa AI for teachers or students; use Pro or TOP10 for AI.",
  "PRO: ACTIVE plan period, AI credits > 0, daily request cap, daily token cap.",
  "TOP10: ACTIVE plan period; high token allowance with monitoring; no per-request credit deduction.",
] as const;
