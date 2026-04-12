import type { Metadata } from "next";
import Link from "next/link";
import { RootscareApplicationForm } from "@/components/teachx/business/rootscare-application-form";
import { BusinessCard } from "@/components/teachx/business/business-card";
import { requireTeachxBusinessUser } from "@/lib/teachx-business-gate";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "RootsCare Franchise — TeachX Business",
  description: "Become a RootsCare Career Partner",
};

export default async function TeachXBusinessRootscarePage() {
  const user = await requireTeachxBusinessUser();
  const pending = await prisma.teachxBusinessApplication.findFirst({
    where: { userId: user.id, type: "ROOTSCARE_PARTNER", status: "PENDING" },
    select: { id: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">RootsCare Franchise</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Offer AI-powered career assessments and structured counseling under the RootsCare brand.
        </p>
      </div>

      <p className="max-w-2xl">
        <a
          href="#rootscare-apply"
          className="inline-flex rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-95"
        >
          Apply for RootsCare Partner
        </a>
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <BusinessCard title="Why partner" subtitle="High-trust guidance at scale">
          <ul className="space-y-3 text-sm text-slate-600">
            <li>
              <span className="font-medium text-slate-800">Career guidance</span> — structured journeys for students
              and early professionals.
            </li>
            <li>
              <span className="font-medium text-slate-800">AI-powered assessments</span> — faster intake and richer
              insight summaries.
            </li>
            <li>
              <span className="font-medium text-slate-800">Counseling support</span> — playbooks and escalation paths
              as you grow.
            </li>
          </ul>
        </BusinessCard>
        <BusinessCard title="Learn more" subtitle="Public program overview">
          <p className="text-sm text-slate-600">
            Explore the RootsCare story and assessment flow on the marketing site when you are briefing prospects.
          </p>
          <Link
            href="/rootscare"
            className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Open RootsCare
          </Link>
        </BusinessCard>
      </div>

      <div id="rootscare-apply" className="scroll-mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Apply for RootsCare Partner</h2>
        <RootscareApplicationForm initialPending={Boolean(pending)} />
      </div>
    </div>
  );
}
