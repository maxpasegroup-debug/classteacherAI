import { redirect } from "next/navigation";
import { getCurrentSession, setSessionCookie, signSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingChatClient } from "@/components/onboarding-chat-client";

export default async function OnboardingPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
    select: { onboardingCompleted: true },
  });

  if (profile?.onboardingCompleted) {
    const token = signSessionToken({ userId: session.userId, onboardingCompleted: true });
    await setSessionCookie(token);
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  });
  const defaultName = user?.name?.trim() || user?.email?.split("@")[0] || "Student";

  return <OnboardingChatClient defaultName={defaultName} />;
}
