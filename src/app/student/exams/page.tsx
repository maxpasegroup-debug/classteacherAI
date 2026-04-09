import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentExamsClient } from "@/components/student-exams-client";

export default async function StudentExamsPage() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") redirect("/auth/login");

  const [exams, user] = await Promise.all([
    prisma.exam.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { plan: true },
    }),
  ]);

  return (
    <main className="min-h-screen px-4 py-8 bg-elite-mesh">
      <section className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Training</p>
          <h1 className="font-training-display text-3xl text-slate-900">Exam Engine</h1>
          <p className="text-sm text-training-muted">Focused practice — clean runs, clear outcomes.</p>
        </header>
        <StudentExamsClient exams={exams} plan={user?.plan ?? "BASIC"} />
      </section>
    </main>
  );
}
