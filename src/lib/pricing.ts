/**
 * Single source of truth for public pricing (INR) and included AI credits.
 * `User.plan` strings: BASIC | PRO | ELITE | TOPRANK.
 */

import { isTopRankPlan } from "@/lib/plan-tier";

export const PLANS = {
  BASIC: {
    key: "BASIC" as const,
    name: "Basic",
    label: "Trial + Basic",
    priceInr: 199,
    creditsIncluded: 0,
    aiEnabled: true,
    summary:
      "15-day free trial, then ₹199/month: limited exams per week, 5 Nexa messages per day, core analytics. Upgrade for adaptive training and full coaching.",
  },
  PRO: {
    key: "PRO" as const,
    name: "Pro",
    label: "Pro",
    priceInr: 499,
    creditsIncluded: 2000,
    aiEnabled: true,
    summary:
      "10 exams per week, adaptive training loop, Nexa (50 messages/day + credits), performance analytics — built for consistent rank prep.",
  },
  ELITE: {
    key: "ELITE" as const,
    name: "Elite",
    label: "Elite",
    priceInr: 1999,
    creditsIncluded: 8000,
    aiEnabled: true,
    summary: "Unlimited exams, full Nexa token budget, adaptive system, larger credit pool — for serious contenders.",
  },
  TOPRANK: {
    key: "TOPRANK" as const,
    name: "TopRank",
    label: "TopRank",
    priceInr: 4999,
    creditsIncluded: 500_000,
    aiEnabled: true,
    summary:
      "Hardcore rank trainer: TopRank loop, highest difficulty, fastest progression, maximum Nexa — full discipline mode.",
  },
} as const;

/** Matrix for /pricing — keys line up with PlanFeature + quotas. */
export const PLAN_FEATURE_MATRIX: {
  label: string;
  basic: string;
  pro: string;
  elite: string;
  toprank: string;
  highlight?: boolean;
}[] = [
  {
    label: "Exams (per UTC week)",
    basic: "Up to 3",
    pro: "Up to 10",
    elite: "Unlimited",
    toprank: "Unlimited",
  },
  {
    label: "Adaptive training loop",
    basic: "—",
    pro: "Yes",
    elite: "Yes",
    toprank: "Yes (aggressive)",
    highlight: true,
  },
  {
    label: "Nexa AI",
    basic: "5 messages / day",
    pro: "50 messages / day + credits",
    elite: "Full (high token cap)",
    toprank: "Full (TopRank caps)",
  },
  {
    label: "TopRank hardcore mode",
    basic: "—",
    pro: "—",
    elite: "—",
    toprank: "Yes",
    highlight: true,
  },
  {
    label: "Daily rank task API",
    basic: "—",
    pro: "Yes",
    elite: "Yes",
    toprank: "Yes",
  },
];

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
  "Basic: 15-day free trial or paid Basic — 3 exam starts per UTC week, 5 Nexa messages per day.",
  "Pro: active subscription, 10 exams per week, adaptive training + Nexa (50 messages/day) with credits and token caps.",
  "Elite: active subscription, unlimited exams, full Nexa allowance, adaptive system.",
  "TopRank: active subscription, unlimited exams, hardcore TopRank loop, highest Nexa allowance.",
] as const;
