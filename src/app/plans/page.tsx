import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { canAccessStudentApp } from "@/lib/plan-access";
import { PLANS } from "@/lib/pricing";
import { PlansClient } from "./plans-client";

export default async function PlansPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");

  await applyPlanExpiry(session.userId);

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
    select: { onboardingCompleted: true },
  });
  if (!profile?.onboardingCompleted) redirect("/onboarding");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      subscriptionExpiry: true,
      isTrialActive: true,
      trialEndsAt: true,
      trialStartDate: true,
    },
  });
  if (!user) redirect("/auth/login");

  if (
    canAccessStudentApp({
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry,
      isTrialActive: user.isTrialActive,
      trialEndsAt: user.trialEndsAt,
    })
  ) {
    redirect("/dashboard");
  }

  return (
    <PlansClient
      basic={PLANS.BASIC}
      pro={PLANS.PRO}
      elite={PLANS.ELITE}
      toprank={PLANS.TOPRANK}
      trialAlreadyUsed={Boolean(user.trialStartDate)}
    />
  );
}
