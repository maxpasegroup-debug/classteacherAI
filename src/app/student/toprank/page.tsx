import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { TopRankHubClient, type TopRankVisionDto } from "@/components/toprank-hub-client";
import { isTopRankPlan } from "@/lib/plan-tier";

export default async function TopRankTrainingPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");

  await applyPlanExpiry(session.userId);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      subscriptionExpiry: true,
    },
  });

  if (!user) redirect("/auth/login");

  const paidTopRank =
    isTopRankPlan(user.plan) &&
    user.subscriptionStatus === "ACTIVE" &&
    Boolean(user.subscriptionExpiry && user.subscriptionExpiry > new Date());

  let initialVision: TopRankVisionDto | null = null;
  if (isTopRankPlan(user.plan)) {
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
