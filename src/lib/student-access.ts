import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { applyPlanExpiry } from "@/lib/billing";

/** Student-dashboard feature gates (enforced in API routes). */
export type StudentFeature =
  | "exam_start"
  | "study_help"
  | "skills_progress_write"
  | "performance_basic"
  | "performance_full"
  | "top10_training";

export function planAllowsFeature(plan: SubscriptionPlan, feature: StudentFeature): boolean {
  if (plan === "TOP10") return true;
  if (plan === "PRO") {
    if (feature === "top10_training" || feature === "performance_basic") return false;
    return true;
  }
  if (plan === "BASIC") {
    return feature === "exam_start" || feature === "performance_basic";
  }
  return false;
}

/**
 * Student must have ACTIVE status and plan period not ended (planExpiry in the future).
 */
export async function requireActiveStudentPlan(userId: string) {
  await applyPlanExpiry(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true, planExpiry: true },
  });
  if (!user) {
    return { ok: false as const, code: "NOT_FOUND" as const, error: "User not found." };
  }
  if (user.subscriptionStatus !== "ACTIVE") {
    return { ok: false as const, code: "SUBSCRIPTION" as const, error: "Subscription inactive. Renew or upgrade." };
  }
  if (!user.planExpiry || user.planExpiry < new Date()) {
    return { ok: false as const, code: "EXPIRED" as const, error: "Plan period ended. Renew to continue." };
  }
  return { ok: true as const, user };
}

export async function requireStudentFeature(userId: string, feature: StudentFeature) {
  const gate = await requireActiveStudentPlan(userId);
  if (!gate.ok) return gate;
  if (!planAllowsFeature(gate.user.plan, feature)) {
    return {
      ok: false as const,
      code: "PLAN" as const,
      error: "Upgrade your plan to use this feature.",
    };
  }
  return { ok: true as const, user: gate.user };
}
