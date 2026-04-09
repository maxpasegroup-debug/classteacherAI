import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TeacherAdvancedPage() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "TEACHER") redirect("/auth/login");

  const [performance, earnings, reviews, sessions] = await Promise.all([
    prisma.studentPerformance.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.earningLedger.aggregate({ where: { userId: session.userId }, _sum: { amount: true } }),
    prisma.teacherReview.findMany({ where: { teacherId: session.userId }, take: 10, orderBy: { createdAt: "desc" } }),
    prisma.sessionBooking.findMany({ where: { teacherId: session.userId }, take: 10, orderBy: { scheduledAt: "desc" } }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Teacher Advanced</h1>
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl bg-white p-4 shadow-sm">Students tracked: {performance.length}</article>
          <article className="rounded-xl bg-white p-4 shadow-sm">Total earnings: ₹{earnings._sum.amount ?? 0}</article>
          <article className="rounded-xl bg-white p-4 shadow-sm">Reviews: {reviews.length}</article>
        </div>
        <article className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Sessions</h2>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {sessions.map((s) => (
              <li key={s.id}>{new Date(s.scheduledAt).toLocaleString()} - {s.subject} ({s.status})</li>
            ))}
          </ul>
        </article>
        <div className="flex gap-3">
          <Link href="/api/teacher/analytics" className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">View analytics JSON</Link>
          <Link href="/pricing" className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">Manage monetization</Link>
        </div>
      </section>
    </main>
  );
}
