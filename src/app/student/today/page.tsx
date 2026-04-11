import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { StudentTodayClient } from "@/components/student-today-client";

export default async function StudentTodayPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/auth/login");
  }

  await applyPlanExpiry(session.userId);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      plan: true,
      subscriptionStatus: true,
      subscriptionExpiry: true,
      studentProfile: {
        select: {
          onboardingCompleted: true,
          targetRank: true,
          level: true,
          trainingIntensity: true,
          weakAreaFocus: true,
          recommendedDailyQuestions: true,
          difficultyStartLevel: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.studentProfile?.onboardingCompleted) {
    redirect("/onboarding");
  }

  const paidActive =
    user.subscriptionStatus === "ACTIVE" &&
    Boolean(user.subscriptionExpiry && user.subscriptionExpiry > new Date());

  return (
    <StudentTodayClient
      previewOnly={!paidActive}
      userName={user.name}
      plan={user.plan}
      rankProfile={{
        targetRank: user.studentProfile.targetRank,
        level: user.studentProfile.level,
        trainingIntensity: user.studentProfile.trainingIntensity,
        weakAreaFocus: user.studentProfile.weakAreaFocus,
        recommendedDailyQuestions: user.studentProfile.recommendedDailyQuestions,
        difficultyStartLevel: user.studentProfile.difficultyStartLevel,
      }}
    />
  );
}
