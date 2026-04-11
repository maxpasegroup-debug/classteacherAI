import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentPerformanceClient } from "@/components/student-performance-client";

export default async function StudentPerformancePage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-0 rounded-2xl border border-zinc-800/50 bg-slate-50 p-4 sm:p-6">
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Growth</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Performance & progress</h1>
          <p className="mt-2 text-sm text-slate-600">
            Hi {user.name} â€” this hub tracks accuracy, speed, topic mastery, consistency, and rank readiness from every
            submitted attempt. Graphs, the weakness heatmap, and AI-style insights update as you practice.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/student/today" className="font-medium text-blue-600 hover:text-blue-700">
              â† Today
            </Link>
            <Link href="/student/exams" className="font-medium text-slate-600 hover:text-slate-900">
              Exams
            </Link>
          </div>
        </div>

        <StudentPerformanceClient />
      </section>
    </div>
  );
}
