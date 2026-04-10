import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subscriptionTierLabel } from "@/lib/pricing";
import { RoleSwitcher } from "@/components/role-switcher";
import { TeacherDashboardClient } from "@/components/teacher-dashboard-client";

export default async function TeacherDashboardPage() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "TEACHER") {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, roles: true, plan: true, credits: true },
  });

  if (!user || !user.roles.includes("TEACHER")) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Teacher Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Welcome back, {user.name}.</p>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
          <p className="mt-1 text-xs text-slate-500">
            Plan: {subscriptionTierLabel(user.plan)} · AI credits: {user.credits}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <RoleSwitcher roles={user.roles} activeRole={session.activeRole} />
            <Link href="/pricing" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
              Upgrade Plan
            </Link>
            <Link href="/credits" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
              Buy Credits
            </Link>
            <Link href="/nexa" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
              Open Nexa Chat
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/today"
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
          >
            <p className="text-sm font-semibold text-slate-900">Today</p>
            <p className="mt-1 text-xs text-slate-500">Daily hub and quick links</p>
          </Link>
          <Link
            href="/classes"
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
          >
            <p className="text-sm font-semibold text-slate-900">Classes</p>
            <p className="mt-1 text-xs text-slate-500">Sessions and schedules</p>
          </Link>
          <Link
            href="/teacher/advanced"
            className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm transition hover:border-emerald-300"
          >
            <p className="text-sm font-semibold text-emerald-900">Advanced</p>
            <p className="mt-1 text-xs text-emerald-800/90">Analytics &amp; report cards</p>
          </Link>
          <Link
            href="/skills"
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
          >
            <p className="text-sm font-semibold text-slate-900">Skills catalog</p>
            <p className="mt-1 text-xs text-slate-500">Course preview (shared)</p>
          </Link>
        </div>

        <TeacherDashboardClient initialCredits={user.credits} />
      </section>
    </main>
  );
}
