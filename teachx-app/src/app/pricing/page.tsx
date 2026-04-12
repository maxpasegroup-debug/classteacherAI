import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TeachXHeader } from "@/components/teachx/teachx-header";
import { TeachXPricingClient } from "@/components/teachx/teachx-pricing-client";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mainClassteacherOrigin } from "@/lib/main-app";
import { TEACHX_PLANS, normalizeTeachxPlan } from "@/lib/teachxPlanConfig";

export const metadata: Metadata = {
  title: "Pricing — TeachX",
  description: "TeachX plans for teachers: Free, Pro, and Business.",
};

export default async function TeachXPricingPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, teachxPlan: true },
  });
  if (!user || user.role !== "TEACHER") {
    redirect(mainClassteacherOrigin());
  }

  const current = normalizeTeachxPlan(user.teachxPlan);

  return (
    <>
      <TeachXHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Dashboard
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">TeachX</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Plans &amp; pricing</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Nexa AI for lesson planning and content — unlock more as you grow.
        </p>

        <TeachXPricingClient
          currentPlan={current}
          free={TEACHX_PLANS.FREE}
          pro={TEACHX_PLANS.PRO}
          business={TEACHX_PLANS.BUSINESS}
        />
      </main>
    </>
  );
}
