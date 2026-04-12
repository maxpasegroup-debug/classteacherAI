import { redirect } from "next/navigation";
import { getCurrentSession, setSessionCookie, signSessionToken } from "@/lib/auth";
import { OnboardingChatClient } from "@/components/onboarding-chat-client";
import { resolvePostAuthRedirect } from "@/lib/post-auth-redirect";
import { prisma } from "@/lib/prisma";
import type { AppUserRole } from "@/lib/session-payload";

export default async function OnboardingPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
    select: { onboardingCompleted: true },
  });

  if (profile?.onboardingCompleted) {
    const row = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        role: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionExpiry: true,
        isTrialActive: true,
        trialEndsAt: true,
      },
    });
    const appRole: AppUserRole = row?.role === "TEACHER" ? "TEACHER" : "STUDENT";
    const token = signSessionToken({ userId: session.userId, onboardingCompleted: true, role: appRole });
    await setSessionCookie(token);
    if (!row) redirect("/dashboard");
    redirect(
      resolvePostAuthRedirect(true, {
        plan: row.plan,
        subscriptionStatus: row.subscriptionStatus,
        subscriptionExpiry: row.subscriptionExpiry,
        isTrialActive: row.isTrialActive,
        trialEndsAt: row.trialEndsAt,
        role: appRole,
      }),
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, role: true },
  });
  if (user?.role === "TEACHER") {
    redirect("/teachx/dashboard");
  }
  const defaultName = user?.name?.trim() || user?.email?.split("@")[0] || "Student";

  return <OnboardingChatClient defaultName={defaultName} />;
}
