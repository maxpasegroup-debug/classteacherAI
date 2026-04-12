import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTopRankPlan } from "@/lib/plan-tier";

/** Product feature flags for monetization / gating. */
export type PlanFeature = "exam_access" | "nexa_access" | "advanced_training" | "toprank_mode";

export type PlanUserSnapshot = {
  plan: string;
  subscriptionStatus: string;
  subscriptionExpiry: Date | null;
  isTrialActive?: boolean;
  trialEndsAt?: Date | null;
};

export type PlanUsageSnapshot = {
  examsThisUtcWeek: number;
  nexaMessagesToday: number;
};

export const BASIC_EXAMS_PER_UTC_WEEK = 3;
export const PRO_EXAMS_PER_UTC_WEEK = 10;
export const BASIC_NEXA_MESSAGES_PER_DAY = 5;
/** PRO: Nexa allowed but capped per UTC day (Elite / TopRank use higher technical caps). */
export const PRO_NEXA_MESSAGES_PER_DAY = 50;

export function utcWeekStart(d = new Date()): Date {
  const day = d.getUTCDay();
  const daysFromMonday = (day + 6) % 7;
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysFromMonday));
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function utcDayStart(d = new Date()): Date {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function hasActivePaidPeriod(user: PlanUserSnapshot): boolean {
  if (user.subscriptionStatus !== "ACTIVE") return false;
  if (!user.subscriptionExpiry) return false;
  return user.subscriptionExpiry.getTime() >= Date.now();
}

export function hasActiveTrial(user: PlanUserSnapshot): boolean {
  if (!user.isTrialActive || !user.trialEndsAt) return false;
  return user.trialEndsAt.getTime() >= Date.now();
}

/** Basic tier: active trial or active paid period (incl. paid Basic after trial). */
export function hasBasicAppAccess(user: PlanUserSnapshot): boolean {
  if (user.plan !== "BASIC") return false;
  return hasActiveTrial(user) || hasActivePaidPeriod(user);
}

/** Student shell: paid subscription period or active trial window. */
export function canAccessStudentApp(user: PlanUserSnapshot): boolean {
  return hasActivePaidPeriod(user) || hasActiveTrial(user);
}

/**
 * Pure rule engine: plan + current usage → allowed or upgrade path.
 * Pass fresh `usage` from `countExamStartsThisUtcWeek` / `countNexaMessagesToday` when gating rate limits.
 */
export function checkUserAccess(
  user: PlanUserSnapshot,
  feature: PlanFeature,
  usage: PlanUsageSnapshot,
):
  | { ok: true }
  | { ok: false; upgradeRequired: boolean; message: string; code: string } {
  const paid = hasActivePaidPeriod(user);
  const plan = user.plan;

  switch (feature) {
    case "exam_access": {
      if (plan === "BASIC") {
        if (!hasBasicAppAccess(user)) {
          return {
            ok: false,
            upgradeRequired: true,
            message: "Start your free trial or subscribe to continue training.",
            code: "SUBSCRIPTION",
          };
        }
        if (usage.examsThisUtcWeek >= BASIC_EXAMS_PER_UTC_WEEK) {
          return {
            ok: false,
            upgradeRequired: true,
            message: "Weekly exam limit reached on Basic. Upgrade to continue.",
            code: "RATE_LIMIT",
          };
        }
        return { ok: true };
      }
      if (plan === "PRO") {
        if (!paid) {
          return {
            ok: false,
            upgradeRequired: true,
            message: "Upgrade to continue — activate Pro to unlock your weekly exam quota.",
            code: "SUBSCRIPTION",
          };
        }
        if (usage.examsThisUtcWeek >= PRO_EXAMS_PER_UTC_WEEK) {
          return {
            ok: false,
            upgradeRequired: true,
            message: "Weekly exam limit reached on Pro. Upgrade to Elite or TopRank for unlimited exams.",
            code: "RATE_LIMIT",
          };
        }
        return { ok: true };
      }
      if (plan === "ELITE" || isTopRankPlan(plan)) {
        if (!paid) {
          return {
            ok: false,
            upgradeRequired: true,
            message: "Subscription inactive or expired. Renew to continue.",
            code: "SUBSCRIPTION",
          };
        }
        return { ok: true };
      }
      return {
        ok: false,
        upgradeRequired: true,
        message: "Upgrade to continue.",
        code: "PLAN",
      };
    }
    case "nexa_access": {
      if (plan === "BASIC") {
        if (!hasBasicAppAccess(user)) {
          return {
            ok: false,
            upgradeRequired: true,
            message: "Your free trial has ended. Upgrade to continue training.",
            code: "SUBSCRIPTION",
          };
        }
        if (usage.nexaMessagesToday >= BASIC_NEXA_MESSAGES_PER_DAY) {
          return {
            ok: false,
            upgradeRequired: true,
            message: "Daily Nexa limit reached on Basic (5 messages). Upgrade for full coaching.",
            code: "RATE_LIMIT",
          };
        }
        return { ok: true };
      }
      if (plan === "PRO" || plan === "ELITE" || isTopRankPlan(plan)) {
        if (!paid) {
          return {
            ok: false,
            upgradeRequired: true,
            message: "Subscription inactive or expired. Renew to use Nexa.",
            code: "SUBSCRIPTION",
          };
        }
        return { ok: true };
      }
      return {
        ok: false,
        upgradeRequired: true,
        message: "Upgrade to continue.",
        code: "PLAN",
      };
    }
    case "advanced_training": {
      if (plan === "BASIC") {
        return {
          ok: false,
          upgradeRequired: true,
          message: "Adaptive training loop requires Pro or higher. Upgrade to continue.",
          code: "PLAN",
        };
      }
      if (plan === "PRO" || plan === "ELITE" || isTopRankPlan(plan)) {
        if (!paid) {
          return {
            ok: false,
            upgradeRequired: true,
            message: "Subscription inactive or expired. Renew to use the training loop.",
            code: "SUBSCRIPTION",
          };
        }
        return { ok: true };
      }
      return {
        ok: false,
        upgradeRequired: true,
        message: "Upgrade to continue.",
        code: "PLAN",
      };
    }
    case "toprank_mode": {
      if (!isTopRankPlan(plan) || !paid) {
        return {
          ok: false,
          upgradeRequired: true,
          message: "TopRank hardcore loop requires an active TopRank plan. Upgrade to continue.",
          code: "PLAN",
        };
      }
      return { ok: true };
    }
    default:
      return {
        ok: false,
        upgradeRequired: true,
        message: "Upgrade to continue.",
        code: "PLAN",
      };
  }
}

export async function countExamStartsThisUtcWeek(userId: string): Promise<number> {
  const since = utcWeekStart();
  const [legacy, bank] = await Promise.all([
    prisma.examAttempt.count({ where: { userId, startedAt: { gte: since } } }),
    prisma.attempt.count({ where: { userId, createdAt: { gte: since } } }),
  ]);
  return legacy + bank;
}

export async function countNexaMessagesToday(userId: string): Promise<number> {
  const day = utcDayStart();
  const row = await prisma.usageStat.findUnique({
    where: { userId_day: { userId, day } },
    select: { aiRequests: true },
  });
  return row?.aiRequests ?? 0;
}

export function accessDeniedResponse(
  denied: Extract<ReturnType<typeof checkUserAccess>, { ok: false }>,
  httpStatus?: number,
) {
  const status =
    httpStatus ?? (denied.code === "RATE_LIMIT" ? 429 : denied.code === "CREDITS" ? 402 : 403);
  return NextResponse.json(
    {
      success: false,
      upgradeRequired: denied.upgradeRequired,
      message: denied.message,
      error: denied.message,
      code: denied.code,
    },
    { status },
  );
}
