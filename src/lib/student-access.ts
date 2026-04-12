import { prisma } from "@/lib/prisma";
import { applyPlanExpiry } from "@/lib/billing";
import { isTopRankPlan } from "@/lib/plan-tier";
import {
  checkUserAccess,
  countExamStartsThisUtcWeek,
  type PlanUserSnapshot,
} from "@/lib/plan-access";

/** Student-dashboard feature gates (enforced in API routes). */
export type StudentFeature =
  | "exam_start"
  | "advanced_training"
  | "study_help"
  | "skills_progress_write"
  | "performance_basic"
  | "performance_full"
  | "top10_training";

export function planAllowsFeature(plan: string, feature: StudentFeature): boolean {
  if (isTopRankPlan(plan)) return true;
  if (plan === "PRO" || plan === "ELITE") {
    return feature !== "top10_training";
  }
  if (plan === "BASIC") {
    return feature === "exam_start" || feature === "performance_basic";
  }
  return false;
}

/**
 * Student must have ACTIVE status and subscription period not ended (paid surfaces).
 * Free Basic tier uses exam/Nexa limits without passing this gate.
 */
export async function requireActiveStudentPlan(userId: string) {
  await applyPlanExpiry(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true, subscriptionExpiry: true },
  });
  if (!user) {
    return { ok: false as const, code: "NOT_FOUND" as const, error: "User not found." };
  }
  if (user.subscriptionStatus !== "ACTIVE") {
    return { ok: false as const, code: "SUBSCRIPTION" as const, error: "Subscription inactive. Renew or upgrade." };
  }
  if (!user.subscriptionExpiry || user.subscriptionExpiry < new Date()) {
    return { ok: false as const, code: "EXPIRED" as const, error: "Plan period ended. Renew to continue." };
  }
  return { ok: true as const, user };
}

function snapshot(u: { plan: string; subscriptionStatus: string; subscriptionExpiry: Date | null }): PlanUserSnapshot {
  return {
    plan: u.plan,
    subscriptionStatus: u.subscriptionStatus,
    subscriptionExpiry: u.subscriptionExpiry,
  };
}

export async function requireStudentFeature(userId: string, feature: StudentFeature) {
  await applyPlanExpiry(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true, subscriptionExpiry: true },
  });
  if (!user) {
    return { ok: false as const, code: "NOT_FOUND" as const, error: "User not found." };
  }

  if (feature === "exam_start") {
    const examsThisUtcWeek = await countExamStartsThisUtcWeek(userId);
    const access = checkUserAccess(snapshot(user), "exam_access", {
      examsThisUtcWeek,
      nexaMessagesToday: 0,
    });
    if (!access.ok) {
      return {
        ok: false as const,
        code: access.code as "PLAN" | "SUBSCRIPTION" | "EXPIRED" | "RATE_LIMIT",
        error: access.message,
        upgradeRequired: access.upgradeRequired,
      };
    }
    return { ok: true as const, user };
  }

  if (feature === "advanced_training") {
    const access = checkUserAccess(snapshot(user), "advanced_training", {
      examsThisUtcWeek: 0,
      nexaMessagesToday: 0,
    });
    if (!access.ok) {
      return {
        ok: false as const,
        code: access.code as "PLAN" | "SUBSCRIPTION" | "EXPIRED" | "RATE_LIMIT",
        error: access.message,
        upgradeRequired: access.upgradeRequired,
      };
    }
    return { ok: true as const, user };
  }

  if (feature === "top10_training") {
    const access = checkUserAccess(snapshot(user), "toprank_mode", {
      examsThisUtcWeek: 0,
      nexaMessagesToday: 0,
    });
    if (!access.ok) {
      return {
        ok: false as const,
        code: access.code as "PLAN" | "SUBSCRIPTION" | "EXPIRED" | "RATE_LIMIT",
        error: access.message,
        upgradeRequired: access.upgradeRequired,
      };
    }
    return { ok: true as const, user };
  }

  const gate = await requireActiveStudentPlan(userId);
  if (!gate.ok) {
    return {
      ...gate,
      upgradeRequired: gate.code === "SUBSCRIPTION" || gate.code === "EXPIRED",
    };
  }
  if (!planAllowsFeature(gate.user.plan, feature)) {
    return {
      ok: false as const,
      code: "PLAN" as const,
      error: "Upgrade your plan to use this feature.",
      upgradeRequired: true,
    };
  }
  return { ok: true as const, user: gate.user };
}
