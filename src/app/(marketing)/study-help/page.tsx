import type { Metadata } from "next";
import { MarketingCard } from "@/components/marketing/marketing-card";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata: Metadata = {
  title: "Study Help — ClassteacherAI",
  description: "Personalized study support: hourly sessions, weekly plans, and monthly mentorship.",
};

const tiers: {
  name: string;
  price: string;
  cadence: string;
  features: string[];
  badge: string;
  highlight?: boolean;
}[] = [
  {
    name: "Hourly clarity",
    price: "1:1 sessions",
    cadence: "Book by the hour",
    features: ["Live focus blocks", "Doubt teardown", "Same-day notes structure"],
    badge: "Flexible",
  },
  {
    name: "Weekly rhythm",
    price: "Structured plans",
    cadence: "7-day sprint cycles",
    features: ["Priority topics", "Mock checkpoints", "Accountability nudges"],
    badge: "Popular",
    highlight: true,
  },
  {
    name: "Monthly mentorship",
    price: "Deep partnership",
    cadence: "4-week arcs",
    features: ["Habit design", "Exam calendar sync", "Parent-ready summaries"],
    badge: "Elite",
  },
];

export default function StudyHelpPage() {
  return (
    <main>
      <MarketingSection className="pt-12 pb-16 md:pt-20 md:pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Human + AI support</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Personalized Study Support
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
          When the syllabus feels infinite, you need a cadence. Hourly breakthroughs, weekly plans, or monthly mentorship —
          all booked through your ClassteacherAI account.
        </p>
      </MarketingSection>

      <MarketingSection className="pb-20 md:pb-28">
        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map(({ name, price, cadence, features, badge, highlight }) => (
            <MarketingCard
              key={name}
              highlighted={highlight}
              className={`flex flex-col p-8 ${highlight ? "lg:-translate-y-1 lg:shadow-xl" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                  {badge}
                </span>
                <span className="text-xs font-medium text-slate-500">{cadence}</span>
              </div>
              <h2 className="mt-6 text-xl font-semibold text-slate-900">{name}</h2>
              <p className="mt-1 text-sm font-semibold text-sky-700">{price}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
                {features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-center text-xs font-medium text-slate-500">
                Select a slot after sign-in — calendar opens from your dashboard hub.
              </div>
            </MarketingCard>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <MarketingCta variant="primary" className="h-14 px-10 text-base">
            Book Session
          </MarketingCta>
        </div>
      </MarketingSection>
    </main>
  );
}
