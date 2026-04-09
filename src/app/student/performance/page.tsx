import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentPerformanceClient } from "@/components/student-performance-client";

export default async function StudentPerformancePage() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, roles: true },
  });

  if (!user?.roles.includes("STUDENT")) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Growth</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Performance & progress</h1>
          <p className="mt-2 text-sm text-slate-600">
            Hi {user.name} — accuracy, speed, topic mastery, consistency, and rank readiness are saved from each exam.
            Charts and insights read from your stored history.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/student/dashboard" className="font-medium text-blue-600 hover:text-blue-700">
              ← Dashboard
            </Link>
            <Link href="/student/exams" className="font-medium text-slate-600 hover:text-slate-900">
              Exams
            </Link>
          </div>
        </div>

        <StudentPerformanceClient />
      </section>
    </main>
  );
}
