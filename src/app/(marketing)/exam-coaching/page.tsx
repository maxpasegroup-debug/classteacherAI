import type { Metadata } from "next";
import Link from "next/link";
import { MarketingCard } from "@/components/marketing/marketing-card";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata: Metadata = {
  title: "Exam Coaching — ClassteacherAI",
  description: "AI exam coaching for NEET, JEE, UPSC, and more. Rank-focused preparation with real exam simulation.",
};

const exams = [
  { name: "NEET", blurb: "Biology-heavy pacing + drill loops", tone: "from-emerald-500/20 to-teal-500/10" },
  { name: "JEE", blurb: "Speed + accuracy under numerical load", tone: "from-sky-500/20 to-indigo-500/10" },
  { name: "UPSC", blurb: "Mains mindset with structured revision", tone: "from-amber-500/20 to-orange-500/10" },
  { name: "SSC", blurb: "High-volume practice with tight timers", tone: "from-violet-500/20 to-purple-500/10" },
  { name: "Banking", blurb: "Aptitude + reasoning at exam tempo", tone: "from-cyan-500/20 to-sky-500/10" },
  { name: "CAT", blurb: "LRDI and QA with adaptive difficulty", tone: "from-rose-500/20 to-pink-500/10" },
  { name: "CUET", blurb: "Domain tests with confidence scoring", tone: "from-lime-500/20 to-emerald-500/10" },
] as const;

function GridIcon({ label }: { label: string }) {
  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white"
      aria-hidden
    >
      {label.slice(0, 2)}
    </div>
  );
}

export default function ExamCoachingPage() {
  return (
    <main>
      <MarketingSection className="pt-12 pb-16 md:pt-20 md:pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Exam verticals</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
          AI Exam Coaching for the Next Generation
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
          A rank-focused training system — timed papers, weakness maps, and adaptive difficulty that mirrors how top
          rankers actually prepare.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <MarketingCta variant="primary" className="h-12 px-8">
            Start Training
          </MarketingCta>
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            View Plans
          </Link>
        </div>
      </MarketingSection>

      <MarketingSection className="pb-20 md:pb-28">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {exams.map(({ name, blurb, tone }) => (
            <MarketingCard key={name} className={`relative overflow-hidden bg-gradient-to-br ${tone} p-6`}>
              <div className="flex items-start justify-between gap-3">
                <GridIcon label={name} />
                <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Live sim
                </span>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-slate-900">{name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{blurb}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection className="pb-24 md:pb-32">
        <div className="grid gap-8 lg:grid-cols-3">
          {[
            {
              title: "AI training system",
              body: "Continuous loops connect every attempt to the next set — no random question dumps.",
            },
            {
              title: "Rank-focused preparation",
              body: "Signals are built around competition outcomes — speed, accuracy, and consistency together.",
            },
            {
              title: "Real exam simulation",
              body: "Pressure, pacing, and post-mortems that feel like the real hall — before you sit for it.",
            },
          ].map(({ title, body }) => (
            <MarketingCard key={title} className="p-8">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
            </MarketingCard>
          ))}
        </div>
        <div className="mt-14 flex justify-center">
          <MarketingCta variant="primary" className="h-14 px-10 text-base">
            Start Training
          </MarketingCta>
        </div>
      </MarketingSection>
    </main>
  );
}
