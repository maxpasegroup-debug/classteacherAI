import type { Metadata } from "next";
import { MarketingCard } from "@/components/marketing/marketing-card";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata: Metadata = {
  title: "RootsCare — ClassteacherAI",
  description: "Career clarity, mental calm, and decision support for serious students.",
};

export default function RootsCareMarketingPage() {
  return (
    <main>
      <MarketingSection className="pt-12 pb-16 md:pt-20 md:pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">RootsCare</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Find Direction. Build Your Future.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
          RootsCare is the gentler side of the same discipline — career clarity, emotional steadiness, and decisions made
          with evidence instead of panic.
        </p>
      </MarketingSection>

      <MarketingSection className="pb-20 md:pb-28">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Career guidance",
              body: "Map strengths to pathways you can actually execute — not generic advice decks.",
            },
            {
              title: "Mental clarity",
              body: "Reduce noise before big exams with structured reflection and humane pacing.",
            },
            {
              title: "Decision support",
              body: "When two good options feel impossible, we break them down with criteria you trust.",
            },
          ].map(({ title, body }) => (
            <MarketingCard
              key={title}
              className="border-teal-100/80 bg-gradient-to-b from-teal-50/40 to-white p-8"
            >
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
            </MarketingCard>
          ))}
        </div>
        <div className="mt-14 flex justify-center">
          <MarketingCta variant="primary" className="h-14 px-10 text-base">
            Start Guidance
          </MarketingCta>
        </div>
      </MarketingSection>
    </main>
  );
}
