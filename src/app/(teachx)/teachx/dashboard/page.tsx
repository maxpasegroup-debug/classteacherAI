import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TeachXDashboardNexa } from "@/components/teachx/teachx-dashboard-nexa";
import { TeachXLogoutButton } from "@/components/teachx/teachx-logout-button";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTeachxPlan } from "@/lib/teachxPlanConfig";

export const metadata: Metadata = {
  title: "Dashboard — TeachX",
  description: "TeachX teacher dashboard",
};

export default async function TeachXDashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/teachx/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, role: true, teachxPlan: true },
  });
  if (!user) {
    redirect("/teachx/login");
  }
  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  const teachxPlan = normalizeTeachxPlan(user.teachxPlan);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/teachx" className="text-lg font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-600 bg-clip-text text-transparent">
              TEACHX
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/nexa" className="rounded-lg px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100">
              Nexa
            </Link>
            <Link href="/teachx/pricing" className="rounded-lg px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100">
              Pricing
            </Link>
            <Link
              href="/teachx/business"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
            >
              Switch to Business
            </Link>
            <TeachXLogoutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Plan: <span className="font-semibold text-slate-700">{teachxPlan}</span>
        </p>
        <p className="mt-2 text-slate-600">
          Nexa Powered AI Intelligence for Teachers — your workspace is ready. This is a placeholder; teacher tools will
          plug in here.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { t: "Lesson studio", d: "Plan and generate with Nexa (coming soon)." },
            { t: "Classes", d: "Roster and automation shortcuts (coming soon)." },
            { t: "Earnings", d: "Sessions, courses, and payouts overview (coming soon)." },
          ].map((c) => (
            <div
              key={c.t}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="font-semibold text-slate-900">{c.t}</h2>
              <p className="mt-2 text-sm text-slate-600">{c.d}</p>
            </div>
          ))}
        </div>

        <TeachXDashboardNexa teachxPlan={teachxPlan} />

        <p className="mt-10 text-sm text-slate-500">
          Signed in as <span className="font-medium text-slate-700">{user.email}</span>
        </p>
      </main>
    </div>
  );
}
