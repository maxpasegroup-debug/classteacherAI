import type { Metadata } from "next";
import { BusinessCard } from "@/components/teachx/business/business-card";

export const metadata: Metadata = {
  title: "Skills Academy — TeachX Business",
  description: "Refer students to Skills Academy courses",
};

const COURSES = [
  { id: "py-101", title: "Python Foundations", hours: "12h", referral: "15% revenue share / enrollment" },
  { id: "ds-intro", title: "Data Literacy & Visualization", hours: "10h", referral: "12% revenue share / enrollment" },
  { id: "speak-pro", title: "Professional Communication", hours: "8h", referral: "10% revenue share / enrollment" },
  { id: "web-fast", title: "Web Apps — Fast Track", hours: "20h", referral: "15% revenue share / enrollment" },
];

export default function TeachXBusinessSkillsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Skills Academy</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Share curated courses with your network. Referral terms below are sample placeholders — final rates will appear
          in your agreement.
        </p>
      </div>

      <BusinessCard title="Referral earnings (sample)" subtitle="Dummy data for UI only">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Lifetime referrals</p>
            <p className="text-2xl font-bold text-slate-900">127</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Pending payout</p>
            <p className="text-2xl font-bold text-emerald-700">₹4,250</p>
          </div>
        </div>
      </BusinessCard>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Course catalog (sample)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {COURSES.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md"
            >
              <p className="text-xs font-medium text-violet-600">{c.hours}</p>
              <p className="mt-1 font-semibold text-slate-900">{c.title}</p>
              <p className="mt-2 text-sm text-slate-600">{c.referral}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
