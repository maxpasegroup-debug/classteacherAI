import type { Metadata } from "next";
import { BusinessCard } from "@/components/teachx/business/business-card";
import { requireTeachxBusinessUser } from "@/lib/teachx-business-gate";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Applications — TeachX Business",
  description: "Submitted partner and tutor applications",
};

function typeLabel(type: string): string {
  if (type === "TUTOR_ONE_ON_ONE") return "1:1 Teaching (ClassteacherAI)";
  if (type === "ROOTSCARE_PARTNER") return "RootsCare Partner";
  return type;
}

function statusStyle(status: string): string {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-900 ring-emerald-200";
  if (status === "REJECTED") return "bg-rose-100 text-rose-900 ring-rose-200";
  return "bg-amber-100 text-amber-900 ring-amber-200";
}

export default async function TeachXBusinessApplicationsPage() {
  const user = await requireTeachxBusinessUser();
  const rows = await prisma.teachxBusinessApplication.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, status: true, createdAt: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Applications</h1>
        <p className="mt-2 text-slate-600">Track everything you have submitted from this Business workspace.</p>
      </div>

      <BusinessCard title="Submitted applications" subtitle={`${rows.length} total`}>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-600">No applications yet. Start from 1:1 Teaching or RootsCare.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4 font-medium text-slate-800">{typeLabel(r.type)}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusStyle(r.status)}`}
                      >
                        {r.status === "PENDING" ? "Pending" : r.status === "APPROVED" ? "Approved" : "Rejected"}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">
                      {r.createdAt.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BusinessCard>
    </div>
  );
}
