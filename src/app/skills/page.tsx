import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SkillsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");

  const [courses, progress, certificates] = await Promise.all([
    prisma.course.findMany({ include: { lessons: true }, take: 30 }),
    prisma.courseProgress.findMany({ where: { userId: session.userId }, include: { course: true } }),
    prisma.certificate.findMany({ where: { userId: session.userId } }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Skill Platform</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <article key={c.id} className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="font-semibold">{c.title}</h2>
              <p className="text-sm text-slate-600">{c.category}</p>
              <p className="text-xs text-slate-500">Lessons: {c.lessons.length} · Video ready</p>
            </article>
          ))}
        </div>
        <article className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Progress & Certificates</h2>
          <p className="text-sm text-slate-600">Tracked courses: {progress.length} · Certificates: {certificates.length}</p>
        </article>
      </section>
    </main>
  );
}
