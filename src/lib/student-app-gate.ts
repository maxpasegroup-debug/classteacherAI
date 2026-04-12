import { redirect } from "next/navigation";
import { applyPlanExpiry } from "@/lib/billing";
import { canAccessStudentApp } from "@/lib/plan-access";
import { prisma } from "@/lib/prisma";

/** Active paid period or active Basic trial — required for student shell and main app routes. */
export async function requireActiveStudentAppAccess(userId: string): Promise<void> {
  await applyPlanExpiry(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      plan: true,
      subscriptionStatus: true,
      subscriptionExpiry: true,
      isTrialActive: true,
      trialEndsAt: true,
    },
  });
  if (!user) redirect("/auth/login");
  if (user.role === "TEACHER") {
    redirect("/teachx/dashboard");
  }
  if (
    !canAccessStudentApp({
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry,
      isTrialActive: user.isTrialActive,
      trialEndsAt: user.trialEndsAt,
    })
  ) {
    redirect("/plans");
  }
}
