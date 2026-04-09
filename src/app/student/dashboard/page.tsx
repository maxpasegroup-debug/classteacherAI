import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleSwitcher } from "@/components/role-switcher";
import { StudentDashboardClient } from "@/components/student-dashboard-client";

export default async function StudentDashboardPage() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, roles: true, plan: true, aiCredits: true },
  });

  if (!user || !user.roles.includes("STUDENT")) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Student Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Welcome back, {user.name}.</p>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
          <p className="mt-1 text-xs text-slate-500">
            Plan: {user.plan} · AI credits: {user.aiCredits}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <RoleSwitcher roles={user.roles} activeRole={session.activeRole} />
            <Link href="/pricing" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
              Upgrade Plan
            </Link>
            <Link href="/credits" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
              Buy Credits
            </Link>
          </div>
        </div>

        <StudentDashboardClient plan={user.plan} />
      </section>
    </main>
  );
}
