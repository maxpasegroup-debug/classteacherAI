import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { resolvePostAuthRedirect } from "@/lib/post-auth-redirect";
import { prisma } from "@/lib/prisma";
import type { AppUserRole } from "@/lib/session-payload";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/auth/login");
  }

  await applyPlanExpiry(session.userId);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      role: true,
      plan: true,
      subscriptionStatus: true,
      subscriptionExpiry: true,
      isTrialActive: true,
      trialEndsAt: true,
      studentProfile: { select: { onboardingCompleted: true } },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  const appRole: AppUserRole = user.role === "TEACHER" ? "TEACHER" : "STUDENT";
  const onboardingCompleted = Boolean(user.studentProfile?.onboardingCompleted);

  redirect(
    resolvePostAuthRedirect(onboardingCompleted, {
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry,
      isTrialActive: user.isTrialActive,
      trialEndsAt: user.trialEndsAt,
      role: appRole,
    }),
  );
}
