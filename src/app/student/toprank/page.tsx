import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { TopRankHubClient, type TopRankVisionDto } from "@/components/toprank-hub-client";

export default async function TopRankTrainingPage() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") redirect("/auth/login");

  await applyPlanExpiry(session.userId);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      planExpiry: true,
      roles: true,
    },
  });

  if (!user?.roles.includes("STUDENT")) redirect("/auth/login");

  const paidTopRank =
    user.plan === "TOP10" &&
    user.subscriptionStatus === "ACTIVE" &&
    Boolean(user.planExpiry && user.planExpiry > new Date());

  let initialVision: TopRankVisionDto | null = null;
  if (user.plan === "TOP10") {
    const v = await prisma.topRankVisionBoard.findUnique({
      where: { userId: session.userId },
    });
    if (v) {
      initialVision = {
        examTrack: v.examTrack,
        targetRank: v.targetRank,
        targetDate: v.targetDate.toISOString(),
        dreamCollege: v.dreamCollege,
        goalCardLine: v.goalCardLine,
        envStudyTable: v.envStudyTable,
        envDistractionFree: v.envDistractionFree,
        envDailySchedule: v.envDailySchedule,
      };
    }
  }

  return (
    <TopRankHubClient plan={user.plan} paidTopRank={paidTopRank} initialVision={initialVision} />
  );
}
