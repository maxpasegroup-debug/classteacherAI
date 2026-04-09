import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Top10TrainingPage() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") {
    redirect("/auth/login");
  }

  await applyPlanExpiry(session.userId);
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { plan: true, subscriptionStatus: true, planExpiry: true },
  });

  if (!user || user.subscriptionStatus !== "ACTIVE" || !user.planExpiry || user.planExpiry < new Date()) {
    redirect("/pricing");
  }
  if (user.plan !== "TOP10") {
    redirect("/pricing");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">TOP10</p>
        <h1 className="text-2xl font-semibold text-slate-900">Training lab</h1>
        <p className="text-sm text-slate-600">
          Full AI access, advanced analytics, and the daily challenge engine live here. More structured TOP10 modules will
          ship in upcoming releases.
        </p>
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <Link href="/student/exams" className="text-violet-700 underline">
            Exam engine &amp; TOP10 camp
          </Link>
          <Link href="/nexa" className="text-blue-700 underline">
            Nexa AI Trainer
          </Link>
          <Link href="/student/dashboard" className="text-slate-600 underline">
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
