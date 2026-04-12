import type { Metadata } from "next";
import { BusinessCard } from "@/components/teachx/business/business-card";

export const metadata: Metadata = {
  title: "Earnings — TeachX Business",
  description: "Earnings breakdown for TeachX Business partners",
};

export default function TeachXBusinessEarningsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Earnings</h1>
        <p className="mt-2 text-slate-600">Placeholder figures — connects to ledgers and payouts in a later release.</p>
      </div>

      <BusinessCard title="Total balance (dummy)">
        <p className="text-4xl font-bold text-slate-900">₹18,640</p>
        <p className="mt-1 text-sm text-slate-500">All-time · not actual</p>
      </BusinessCard>

      <div className="grid gap-4 sm:grid-cols-3">
        <BusinessCard title="Teaching" subtitle="ClassteacherAI 1:1">
          <p className="text-2xl font-bold text-slate-900">₹12,200</p>
          <p className="mt-2 text-xs text-slate-500">Completed sessions (sample)</p>
        </BusinessCard>
        <BusinessCard title="RootsCare" subtitle="Partner revenue">
          <p className="text-2xl font-bold text-slate-900">₹3,900</p>
          <p className="mt-2 text-xs text-slate-500">Assessments & packages (sample)</p>
        </BusinessCard>
        <BusinessCard title="Skills" subtitle="Academy referrals">
          <p className="text-2xl font-bold text-slate-900">₹2,540</p>
          <p className="mt-2 text-xs text-slate-500">Referral share (sample)</p>
        </BusinessCard>
      </div>
    </div>
  );
}
