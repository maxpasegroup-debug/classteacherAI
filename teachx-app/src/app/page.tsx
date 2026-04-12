import type { Metadata } from "next";
import Link from "next/link";
import { TeachXFooter } from "@/components/teachx/teachx-footer";
import { TeachXHeader } from "@/components/teachx/teachx-header";
import { TeachXSection } from "@/components/teachx/teachx-section";

export const metadata: Metadata = {
  title: "TeachX — Nexa powered AI for teachers",
  description: "AI-powered system that helps teachers plan, manage, and earn. Teach smarter. Live better.",
};

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm shadow-slate-200/50 transition hover:border-blue-200/80 hover:shadow-md">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

export default function TeachXLandingPage() {
  return (
    <>
      <TeachXHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50 to-slate-50">
          <div
            className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/20 to-emerald-400/15 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600/90">TeachX</p>
            <p className="mt-4 max-w-xl text-sm font-medium text-slate-600 sm:text-base">
              Nexa Powered AI Intelligence for Teachers
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.1]">
              Teach Smarter.{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Live Better.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              AI-powered system that helps teachers plan, manage, and earn.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:opacity-95"
              >
                Start with TeachX
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>

        <TeachXSection
          id="nexa"
          eyebrow="AI"
          title="Nexa as your teaching co-pilot"
          description="Draft lesson flows, clarify concepts for different levels, and get suggestions tailored to your classroom — without losing your voice as the educator."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              title="Lesson intelligence"
              body="Shape objectives, pacing, and checks for understanding with AI that respects your curriculum."
            />
            <FeatureCard
              title="Always on your side"
              body="Nexa augments how you teach — it doesn’t replace the relationships that make learning stick."
            />
          </div>
        </TeachXSection>

        <TeachXSection
          eyebrow="Productivity"
          title="Ship plans, worksheets, and structure — faster"
          description="Spend less time on repetitive prep and more time with students."
          className="border-t border-slate-200/80 bg-white"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard title="Lesson plans" body="Structured outlines you can refine, reuse, and adapt per section." />
            <FeatureCard title="Worksheets" body="Practice sets and variations generated to match your difficulty curve." />
            <FeatureCard title="Class automation" body="Lightweight routines for reminders, batches, and follow-ups." />
          </div>
        </TeachXSection>

        <TeachXSection
          eyebrow="Time freedom"
          title="Reclaim your evenings"
          description="When admin and prep shrink, you get margin for rest, family, and the deep work only you can do."
        >
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50/80 to-emerald-50/60 p-8 sm:p-10">
            <ul className="grid gap-4 sm:grid-cols-2">
              {[
                "Fewer last-minute scrambles before class",
                "Clearer weekly rhythm for planning blocks",
                "Space to reflect and iterate on what worked",
                "Energy left for the human side of teaching",
              ].map((line) => (
                <li key={line} className="flex gap-3 text-sm font-medium text-slate-700">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                    aria-hidden
                  />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </TeachXSection>

        <TeachXSection
          eyebrow="Earnings"
          title="Grow income from your expertise"
          description="Use the same intelligence stack to package how you already help students."
          className="border-t border-slate-200/80 bg-white"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard title="1:1 teaching" body="Premium sessions with materials and follow-ups supported by AI prep." />
            <FeatureCard title="Courses" body="Turn recurring explanations into structured modules students can buy." />
            <FeatureCard title="Career guidance" body="Frameworks for counselling conversations and resource drops." />
          </div>
        </TeachXSection>

        {/* Final CTA */}
        <section className="border-t border-slate-200 bg-gradient-to-r from-blue-600 to-emerald-600 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Join TeachX</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-blue-50/95 sm:text-base">
              The same secure auth as ClassteacherAI — a dedicated home for teachers who want AI that works the way they
              work.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50"
            >
              Join TeachX
            </Link>
          </div>
        </section>
      </main>

      <TeachXFooter />
    </>
  );
}
