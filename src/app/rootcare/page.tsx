import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { advancedRootCareUnlocked } from "@/lib/rootcare-funnel";
import { RootcareAssessmentForm } from "@/components/rootcare-assessment-form";
import { RootcareCareerReportButton } from "@/components/rootcare-career-report-button";
import { CardUI } from "@/components/card-ui";
import { StudentEliteNav } from "@/components/student-elite-nav";

export default async function RootcarePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");

  const [user, assessments, reports] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { plan: true },
    }),
    prisma.assessmentAttempt.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, score: true, createdAt: true },
    }),
    prisma.careerReport.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, summary: true, strengths: true, careerSuggestions: true, createdAt: true },
    }),
  ]);

  const plan = user?.plan ?? "BASIC";
  const advanced = advancedRootCareUnlocked(plan);

  return (
    <>
    <main className="min-h-screen bg-slate-50 px-4 py-8 pb-[max(5.5rem,env(safe-area-inset-bottom)+4.5rem)]">
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50/90 via-white to-cyan-50/60 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">RootCare</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Discover your career path</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Stay in one ecosystem: short assessment â†’ personalized career suggestions â†’ human counseling when you are
            ready. Built to extend practice into long-term direction.
          </p>
          <ol className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-teal-900">
            <li className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-teal-100">1 Â· Assessment</li>
            <li className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-teal-100">2 Â· Career suggestions</li>
            <li className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-teal-100">3 Â· Counseling</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/student/today" className="font-medium text-teal-700 hover:text-teal-900">
              â† Today
            </Link>
            <Link href="/student/exams" className="font-medium text-slate-600 hover:text-slate-900">
              Exams
            </Link>
            <Link href="/student/help" className="font-medium text-slate-600 hover:text-slate-900">
              Study help
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <CardUI
            title="Step 1 â€” Assessment"
            description="Five quick sliders (no timer). Saves a snapshot used for your career map."
          >
            <RootcareAssessmentForm />
            {assessments.length > 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                {assessments.length} saved attempt{assessments.length === 1 ? "" : "s"} on file.
              </p>
            ) : null}
          </CardUI>

          <CardUI
            title="Step 2 â€” Career suggestions"
            description="Generate a report from your latest assessment â€” strengths and suggested career clusters."
          >
            <RootcareCareerReportButton />
            {reports.length > 0 ? (
              <ul className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                {reports.map((r) => (
                  <li key={r.id} className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </p>
                    <p className="mt-1 font-medium text-slate-900">{r.summary}</p>
                    {r.strengths.length > 0 ? (
                      <p className="mt-2 text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">Strengths:</span> {r.strengths.join(" Â· ")}
                      </p>
                    ) : null}
                    {r.careerSuggestions.length > 0 ? (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {r.careerSuggestions.map((c) => (
                          <li
                            key={`${r.id}-${c}`}
                            className="rounded-lg bg-teal-100/80 px-2 py-0.5 text-xs font-medium text-teal-950"
                          >
                            {c}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Submit an assessment first, then generate a report.</p>
            )}
          </CardUI>
        </div>

        <div className="rounded-2xl border-2 border-teal-300/60 bg-gradient-to-r from-teal-600 to-cyan-700 p-5 text-white shadow-md">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-100/90">Step 3</p>
          <h2 className="mt-1 text-lg font-semibold">Counseling & long-term guidance</h2>
          <p className="mt-2 max-w-xl text-sm text-teal-50/95">
            Talk through your map with a human â€” request study help, teacher match, or next-step planning. Pro and TOP10
            include deeper touchpoints; everyone can start from Help.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href="/student/help"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-teal-900 shadow-sm hover:bg-teal-50"
            >
              Open counseling & study help
            </Link>
            <Link
              href="/skills"
              className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15"
            >
              Browse skills to match your path
            </Link>
            {!advanced ? (
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Upgrade for full guidance tier
              </Link>
            ) : null}
          </div>
        </div>

        <CardUI
          title={advanced ? "Your plan: counseling & tailored courses" : "Included on Pro / TOP10"}
          description={
            advanced
              ? "Use Help for requests; skills catalog stays aligned with your direction."
              : "Upgrade for priority counseling routing and curated course picks from your RootCare map."
          }
        >
          <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
            <li>
              <span className="font-medium text-slate-900">Counseling:</span>{" "}
              {advanced ? (
                <Link href="/student/help" className="text-teal-700 underline">
                  Request a session via Study help
                </Link>
              ) : (
                <Link href="/pricing" className="text-teal-700 underline">
                  Unlock on Pro or TOP10
                </Link>
              )}
            </li>
            <li>
              <span className="font-medium text-slate-900">Skills:</span>{" "}
              <Link href="/skills" className="text-teal-700 underline">
                Continue learning in the same app
              </Link>
              {!advanced ? <span className="text-slate-500"> â€” upgrade for picks tied to your report.</span> : null}
            </li>
          </ul>
        </CardUI>
      </section>
    </main>
    <StudentEliteNav />
    </>
  );
}
