import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { advancedRootCareUnlocked } from "@/lib/rootcare-funnel";
import { RootcareAssessmentForm } from "@/components/rootcare-assessment-form";
import { RootcareCareerReportButton } from "@/components/rootcare-career-report-button";
import { CardUI } from "@/components/card-ui";

export default async function RootcarePage() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") redirect("/auth/login");

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
      select: { id: true, summary: true, createdAt: true },
    }),
  ]);

  const plan = user?.plan ?? "BASIC";
  const advanced = advancedRootCareUnlocked(plan);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">RootCare</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Understand your career direction
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Optional add-on to your exam practice — quick signals for strengths and paths. Free basics for everyone;
            advanced guidance when your plan supports it.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/student/dashboard" className="font-medium text-teal-700 hover:text-teal-900">
              ← Dashboard
            </Link>
            <Link href="/student/exams" className="font-medium text-slate-600 hover:text-slate-900">
              Exams
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <CardUI
            title="Free — Basic assessment"
            description="Short sliders — no timer. Builds a score snapshot for career mapping."
          >
            <RootcareAssessmentForm />
            {assessments.length > 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                {assessments.length} saved attempt{assessments.length === 1 ? "" : "s"} on file.
              </p>
            ) : null}
          </CardUI>

          <CardUI title="Free — Career mapping" description="Turn your latest assessment into a simple report.">
            <RootcareCareerReportButton />
            {reports.length > 0 ? (
              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-700">
                {reports.map((r) => (
                  <li key={r.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    {r.summary}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Submit an assessment first, then generate a report.</p>
            )}
          </CardUI>
        </div>

        <CardUI
          title={advanced ? "Advanced — Counseling & course suggestions" : "Advanced (Pro / TOP10)"}
          description={
            advanced
              ? "Included with your plan: route to human help and skills that match your direction."
              : "Upgrade for counseling touchpoints and curated course suggestions aligned to your map."
          }
        >
          <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
            <li>
              <span className="font-medium text-slate-900">Counseling:</span>{" "}
              {advanced ? (
                <Link href="/student/dashboard" className="text-teal-700 underline">
                  Request study help or match a teacher
                </Link>
              ) : (
                <Link href="/pricing" className="text-teal-700 underline">
                  Available on Pro and TOP10
                </Link>
              )}
            </li>
            <li>
              <span className="font-medium text-slate-900">Course suggestions:</span>{" "}
              <Link href="/skills" className="text-teal-700 underline">
                Browse skills catalog
              </Link>
              {!advanced ? <span className="text-slate-500"> — upgrade for tailored picks.</span> : null}
            </li>
          </ul>
        </CardUI>
      </section>
    </main>
  );
}
