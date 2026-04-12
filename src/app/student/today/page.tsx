import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { buildStudentRankProfile, parseTargetRankNumber } from "@/lib/student-profile";
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
          studyHours: true,
          weakness: true,
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

  const sp = user.studentProfile;
  const rankN = parseTargetRankNumber(sp.targetRank);
  const derived = buildStudentRankProfile({
    targetRank: rankN,
    level: sp.level,
    studyHours: sp.studyHours,
    weakness: sp.weakness,
  });

  return (
    <StudentTodayClient
      previewOnly={!paidActive}
      userName={user.name}
      plan={user.plan}
      rankProfile={{
        targetRankLabel: sp.targetRank,
        level: sp.level,
        trainingIntensity: derived.trainingIntensity,
        weakAreaFocus: derived.weakAreaFocus,
        recommendedDailyQuestions: derived.recommendedDailyQuestions,
        difficultyStartLevel: derived.difficultyStartLevel,
      }}
    />
  );
}
