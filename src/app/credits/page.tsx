import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreditsClient } from "@/components/credits-client";
import { requireActiveStudentAppAccess } from "@/lib/student-app-gate";

export default async function CreditsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/auth/login");
  }

  await requireActiveStudentAppAccess(session.userId);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { credits: true, plan: true, subscriptionStatus: true, subscriptionExpiry: true },
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
        initialCredits={user.credits}
        plan={user.plan}
        subscriptionStatus={user.subscriptionStatus}
        subscriptionExpiry={user.subscriptionExpiry}
        initialTransactions={recentTransactions.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
