import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/pricing";

/** Cost in credits per Nexa / teacher-generate completion (PRO). TOP10 skips per-request deduction. */
export const AI_REQUEST_CREDIT_COST = 1;

/** BASIC (student): max exam starts per UTC day. */
export const BASIC_EXAM_STARTS_PER_DAY = 3;

/** PRO / TOP10 daily AI cap (abuse prevention). */
export const PAID_DAILY_AI_CAP = 5000;

/** TOP10: treat as unlimited daily; technical cap only. */
export const TOP10_DAILY_AI_CAP = 100_000;

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
 * When subscription period ends: downgrade paid tiers to BASIC trial state or mark expired.
 */
export async function applyPlanExpiry(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true, subscriptionExpiry: true },
  });
  if (!user?.subscriptionExpiry || user.subscriptionStatus !== "ACTIVE") return user;

  if (user.subscriptionExpiry >= new Date()) return user;

  if (user.plan === "PRO" || user.plan === "TOP10") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: "BASIC",
        subscriptionStatus: "EXPIRED",
        subscriptionExpiry: null,
        credits: 0,
      },
    });
    return {
      ...user,
      plan: "BASIC" as SubscriptionPlan,
      subscriptionStatus: "EXPIRED" as SubscriptionStatus,
      subscriptionExpiry: null,
    };
  }

  if (user.plan === "BASIC") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "EXPIRED",
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
        plan: SubscriptionPlan;
        credits: number;
        subscriptionStatus: SubscriptionStatus;
        subscriptionExpiry: Date | null;
      };
      tier: "BASIC" | "PRO" | "TOP10";
    }
  | { ok: false; error: string; code: "PLAN" | "SUBSCRIPTION" | "CREDITS" | "EXPIRED" };

/**
 * AI usage for paid flows (teacher generate, PRO Nexa): needs active period + credits rules.
 * TOP10: no credit balance requirement (unlimited pool).
 * PRO: must have credits > 0 after gate.
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

  if (user.plan === "TOP10") {
    return { ok: true, user, tier: "TOP10" };
  }

  if (user.plan === "PRO") {
    if (user.credits <= 0) {
      return { ok: false, error: "No AI credits remaining. Top up or upgrade.", code: "CREDITS" };
    }
    return { ok: true, user, tier: "PRO" };
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

export function creditsForNewSubscription(plan: SubscriptionPlan): number {
  if (plan === "PRO") return PLANS.PRO.creditsIncluded;
  if (plan === "TOP10") return PLANS.TOP10.creditsIncluded;
  return 0;
}
