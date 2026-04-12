import type { Metadata } from "next";
import { TutorApplicationForm } from "@/components/teachx/business/tutor-application-form";
import { BusinessCard } from "@/components/teachx/business/business-card";
import { requireTeachxBusinessUser } from "@/lib/teachx-business-gate";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "1:1 Teaching — TeachX Business",
  description: "Apply to teach on ClassteacherAI",
};

export default async function TeachXBusinessTeachingPage() {
  const user = await requireTeachxBusinessUser();
  const pending = await prisma.teachxBusinessApplication.findFirst({
    where: { userId: user.id, type: "TUTOR_ONE_ON_ONE", status: "PENDING" },
    select: { id: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">1:1 Teaching</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          ClassteacherAI connects you with students for paid sessions. Complete the application to be listed in the
          marketplace.
        </p>
      </div>

      <BusinessCard title="How it works" subtitle="Lightweight flow — full matching engine ships later">
        <ol className="list-inside list-decimal space-y-2 text-sm text-slate-600">
          <li>Submit your profile, subjects, and pricing.</li>
          <li>Our team reviews quality and fit.</li>
          <li>Once approved, students can discover and book you.</li>
        </ol>
      </BusinessCard>

      <TutorApplicationForm initialPending={Boolean(pending)} />
    </div>
  );
}
