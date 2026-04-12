import type { Metadata } from "next";
import Link from "next/link";
import { MarketingCard } from "@/components/marketing/marketing-card";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata: Metadata = {
  title: "Skills — ClassteacherAI",
  description: "AI-powered skill development: learn AI, build apps, and grow digital fluency.",
};

const courses = [
  { title: "Prompt & AI literacy", level: "Foundation", focus: "Models, safety, and workflow design" },
  { title: "Build with modern web", level: "Builder", focus: "Components, APIs, and shipping fast" },
  { title: "Data & automation", level: "Pro", focus: "Scripts, sheets, and repeatable systems" },
  { title: "Product thinking", level: "Strategy", focus: "Users, metrics, and crisp decisions" },
  { title: "Career signals", level: "Future", focus: "Portfolio, proof, and interview rhythm" },
  { title: "Digital presence", level: "Brand", focus: "Clean storytelling across channels" },
] as const;

export default function SkillsMarketingPage() {
  return (
    <main>
      <MarketingSection className="pt-12 pb-16 md:pt-20 md:pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Future skills</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
          AI-Powered Skill Development
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
          The same rank mindset applied to real-world skills — learn AI, build apps, and sharpen digital fluency with
          structured tracks inside ClassteacherAI.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Already enrolled?{" "}
          <Link href="/skills/learn" className="font-semibold text-sky-700 hover:text-sky-900">
            Open your course dashboard →
          </Link>
        </p>
      </MarketingSection>

      <MarketingSection className="pb-20 md:pb-28">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map(({ title, level, focus }) => (
            <MarketingCard key={title} className="p-7">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{level}</span>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{focus}</p>
              <div className="mt-6 h-24 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10" />
            </MarketingCard>
          ))}
        </div>
        <div className="mt-14 flex justify-center">
          <MarketingCta variant="primary" className="h-14 px-10 text-base">
            Start Learning
          </MarketingCta>
        </div>
      </MarketingSection>
    </main>
  );
}
