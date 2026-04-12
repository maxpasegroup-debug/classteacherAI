import type { Metadata } from "next";
import Link from "next/link";
import { BusinessCard } from "@/components/teachx/business/business-card";

export const metadata: Metadata = {
  title: "Overview — TeachX Business",
  description: "Earnings, modules, and partner programs for TeachX Business teachers.",
};

export default function TeachXBusinessOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Overview</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Grow income through live teaching, RootsCare partnerships, and Skills Academy referrals — all from one
          dashboard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <BusinessCard title="Total earnings (preview)" subtitle="Placeholder until payouts sync">
          <p className="text-3xl font-bold text-slate-900">₹0</p>
          <p className="mt-1 text-xs text-slate-500">Last 30 days · live data coming soon</p>
        </BusinessCard>
        <BusinessCard title="Active modules" subtitle="Programs you can earn from">
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              1:1 Teaching (ClassteacherAI)
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              RootsCare franchise
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Skills Academy referrals
            </li>
          </ul>
        </BusinessCard>
        <BusinessCard title="Nexa insights" subtitle="Coming soon">
          <p className="text-sm text-slate-600">
            Personalized suggestions for pricing, demand, and partner fit will appear here.
          </p>
        </BusinessCard>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Partner modules</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Link href="/business/teaching" className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <p className="text-xs font-semibold text-blue-600">Module 1</p>
            <p className="mt-1 font-semibold text-slate-900 group-hover:text-blue-700">1:1 Teaching</p>
            <p className="mt-2 text-sm text-slate-600">ClassteacherAI bookings and session earnings.</p>
          </Link>
          <Link
            href="/business/rootscare"
            className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <p className="text-xs font-semibold text-emerald-600">Module 2</p>
            <p className="mt-1 font-semibold text-slate-900 group-hover:text-emerald-700">RootsCare Franchise</p>
            <p className="mt-2 text-sm text-slate-600">Career guidance and assessment partnerships.</p>
          </Link>
          <Link href="/business/skills" className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <p className="text-xs font-semibold text-violet-600">Module 3</p>
            <p className="mt-1 font-semibold text-slate-900 group-hover:text-violet-700">Skills Academy</p>
            <p className="mt-2 text-sm text-slate-600">Course referrals and revenue share.</p>
          </Link>
        </div>
      </div>

      <BusinessCard title="Nexa automation (roadmap)" subtitle="UI placeholders — no backend wiring yet">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-center">
            <p className="text-sm font-semibold text-slate-800">AI approval</p>
            <p className="mt-1 text-xs text-slate-500">Screen applications and documents faster.</p>
          </div>
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-center">
            <p className="text-sm font-semibold text-slate-800">AI matching</p>
            <p className="mt-1 text-xs text-slate-500">Pair tutors with the right learners.</p>
          </div>
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-center">
            <p className="text-sm font-semibold text-slate-800">AI scheduling</p>
            <p className="mt-1 text-xs text-slate-500">Optimize slots and reduce no-shows.</p>
          </div>
        </div>
      </BusinessCard>
    </div>
  );
}
