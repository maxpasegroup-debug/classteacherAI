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
    <div className="rounded-2xl border border-amber-500/20 bg-black/90 p-3 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.08)] sm:p-4">
      <TopRankHubClient plan={user.plan} paidTopRank={paidTopRank} initialVision={initialVision} />
    </div>
  );
}
