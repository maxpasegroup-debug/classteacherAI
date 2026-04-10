import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
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
    redirect("/dashboard");
  }

  return <OnboardingChatClient defaultName={session.email.split("@")[0] ?? "Student"} />;
}
