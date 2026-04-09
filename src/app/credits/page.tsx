import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { CreditsClient } from "@/components/credits-client";

export default async function CreditsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/auth/login");
  }

  await applyPlanExpiry(session.userId);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { aiCredits: true, plan: true, subscriptionStatus: true, planExpiry: true },
  });
  if (!user) {
    redirect("/auth/login");
  }

  const recentTransactions = await prisma.transaction.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, type: true, amount: true, status: true, createdAt: true },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <CreditsClient
        initialAiCredits={user.aiCredits}
        plan={user.plan}
        subscriptionStatus={user.subscriptionStatus}
        planExpiry={user.planExpiry}
        initialTransactions={recentTransactions.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
