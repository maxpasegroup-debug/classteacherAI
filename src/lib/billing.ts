import { prisma } from "@/lib/prisma";
import { isTopRankPlan } from "@/lib/plan-tier";
import { PLANS } from "@/lib/pricing";

/** Cost in credits per Nexa completion (PRO / ELITE). TopRank skips per-request deduction. */
export const AI_REQUEST_CREDIT_COST = 1;

/** @deprecated Weekly limits live in `plan-access.ts` (BASIC_EXAMS_PER_UTC_WEEK). */
export const BASIC_EXAM_STARTS_PER_DAY = 3;

/** PRO / ELITE daily AI cap (abuse prevention). */
export const PAID_DAILY_AI_CAP = 5000;

/** TopRank: treat as unlimited daily; technical cap only. */
export const TOPRANK_DAILY_AI_CAP = 100_000;

/** @deprecated use TOPRANK_DAILY_AI_CAP */
export const TOP10_DAILY_AI_CAP = TOPRANK_DAILY_AI_CAP;

export function subscriptionPeriodEnd(from: Date = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + 30);
  return d;
}

export function basicTrialEnd(from: Date = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + 30);
  return d;
}

/**
 * When subscription period ends: downgrade paid tiers to BASIC or mark inactive.
 */
export async function applyPlanExpiry(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true, subscriptionExpiry: true },
  });
  if (!user?.subscriptionExpiry || user.subscriptionStatus !== "ACTIVE") return user;

  if (user.subscriptionExpiry >= new Date()) return user;

  if (user.plan === "PRO" || user.plan === "ELITE" || isTopRankPlan(user.plan)) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: "BASIC",
        subscriptionStatus: "INACTIVE",
        subscriptionExpiry: null,
        credits: 0,
      },
    });
    return {
      ...user,
      plan: "BASIC",
      subscriptionStatus: "INACTIVE",
      subscriptionExpiry: null,
    };
  }

  if (user.plan === "BASIC") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "INACTIVE",
        subscriptionExpiry: null,
        credits: 0,
      },
    });
  }

  return user;
}

export type AiGateResult =
  | {
      ok: true;
      user: {
        id: string;
        plan: string;
        credits: number;
        subscriptionStatus: string;
        subscriptionExpiry: Date | null;
      };
      tier: "BASIC" | "PRO" | "ELITE" | "TOPRANK";
    }
  | { ok: false; error: string; code: "PLAN" | "SUBSCRIPTION" | "CREDITS" | "EXPIRED" };

/**
 * AI usage: active period + credits rules.
 * TopRank: no per-request credit deduction.
 * PRO / ELITE: credits > 0.
 */
export async function assertCanUseAi(userId: string): Promise<AiGateResult> {
  await applyPlanExpiry(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      plan: true,
      credits: true,
      subscriptionStatus: true,
      subscriptionExpiry: true,
    },
  });
  if (!user) return { ok: false, error: "User not found.", code: "PLAN" };

  if (user.subscriptionStatus !== "ACTIVE") {
    return { ok: false, error: "Upgrade plan or renew subscription.", code: "SUBSCRIPTION" };
  }

  if (!user.subscriptionExpiry || user.subscriptionExpiry < new Date()) {
    return { ok: false, error: "Plan period ended. Renew to use AI.", code: "EXPIRED" };
  }

  if (user.plan === "BASIC") {
    return { ok: false, error: "Upgrade to Pro or TopRank for full Nexa AI access.", code: "PLAN" };
  }

  if (isTopRankPlan(user.plan)) {
    return { ok: true, user, tier: "TOPRANK" };
  }

  if (user.plan === "PRO" || user.plan === "ELITE") {
    if (user.credits <= 0) {
      return { ok: false, error: "No AI credits remaining. Top up or upgrade.", code: "CREDITS" };
    }
    return { ok: true, user, tier: user.plan === "ELITE" ? "ELITE" : "PRO" };
  }

  return { ok: false, error: "Invalid plan for AI.", code: "PLAN" };
}

export async function deductAiCredits(userId: string, cost: number = AI_REQUEST_CREDIT_COST): Promise<boolean> {
  try {
    const result = await prisma.user.updateMany({
      where: { id: userId, credits: { gte: cost } },
      data: { credits: { decrement: cost } },
    });
    return result.count === 1;
  } catch {
    return false;
  }
}

export async function refundAiCredits(userId: string, cost: number = AI_REQUEST_CREDIT_COST): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: cost } },
  });
}

export function creditsForNewSubscription(plan: string): number {
  if (plan === "PRO") return PLANS.PRO.creditsIncluded;
  if (plan === "ELITE") return PLANS.ELITE.creditsIncluded;
  if (isTopRankPlan(plan)) return PLANS.TOPRANK.creditsIncluded;
  return 0;
}
