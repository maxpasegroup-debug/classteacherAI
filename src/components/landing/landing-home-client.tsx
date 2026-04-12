"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { NexaTypingLine } from "@/components/landing/nexa-typing-line";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { PLANS } from "@/lib/pricing";

const PLAN_ORDER = ["BASIC", "PRO", "ELITE", "TOPRANK"] as const;

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

function IconTarget({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </svg>
  );
}

function IconCrack({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4l-2 3 2 2-2 3 2 4M12 3l3 3-1 4 3 2-1 5" />
    </svg>
  );
}

function IconLoop({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`rounded-2xl border border-white/60 bg-white/45 px-6 py-5 text-center shadow-[0_8px_40px_-12px_rgba(15,23,42,0.15)] backdrop-blur-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

function GradientBorderCard({
  children,
  highlighted,
  className = "",
}: {
  children: React.ReactNode;
  highlighted?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: highlighted ? 1.04 : 1.025, y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className={`rounded-2xl p-[1px] shadow-[0_12px_40px_-16px_rgba(14,165,233,0.35)] ${
        highlighted
          ? "bg-gradient-to-br from-sky-400 via-cyan-300 to-emerald-400"
          : "bg-gradient-to-br from-slate-200/90 to-slate-100/80"
      }`}
    >
      <div
        className={`flex h-full min-h-0 flex-col rounded-2xl border border-white/50 bg-white/55 p-6 backdrop-blur-xl ${className}`}
      >
        {children}
      </div>
    </motion.div>
  );
}

export function LandingHomeClient() {
  const compRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: compRef,
    offset: ["start end", "end start"],
  });
  const compY = useTransform(scrollYProgress, [0, 1], [18, -18]);

  return (
    <main className="relative overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(70vh,720px)] bg-gradient-to-b from-sky-100/50 via-white to-transparent"
        aria-hidden
      />

      {/* Hero */}
      <MarketingSection className="relative pt-10 pb-16 md:pt-16 md:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            className="order-2 space-y-8 lg:order-1"
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">AI-powered Top Rank Training</p>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.5rem]">
              Train Like a Top Ranker. Become One.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              Stop collecting marks. Start stacking rank — papers that hurt in practice so the hall feels familiar.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <MarketingCta
                  variant="primary"
                  className="h-14 !border-0 !bg-gradient-to-r !from-sky-600 !to-emerald-600 px-8 text-base !shadow-[0_12px_40px_-8px_rgba(14,165,233,0.55)] hover:!bg-gradient-to-r hover:!from-sky-500 hover:!to-emerald-500 hover:!shadow-[0_16px_48px_-8px_rgba(16,185,129,0.45)]"
                >
                  Start Training
                </MarketingCta>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/pricing"
                  className="inline-flex h-14 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/80 px-8 text-base font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition hover:border-slate-300 hover:bg-white"
                >
                  View Plans
                </Link>
              </motion.div>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-500">
              Trusted by serious aspirants · Real exam patterns · Built for the top of the list.
            </p>
          </motion.div>

          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              <motion.div
                className="absolute -right-8 -top-10 h-56 w-56 rounded-full bg-gradient-to-br from-sky-400/50 to-emerald-400/40 blur-3xl"
                animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.08, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden
              />
              <motion.div
                className="absolute -bottom-6 -left-6 h-44 w-44 rounded-full bg-gradient-to-tr from-emerald-400/35 to-sky-500/30 blur-3xl"
                animate={{ opacity: [0.4, 0.75, 0.4] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden
              />
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200 shadow-[0_32px_64px_-20px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5">
                <Image
                  src="/images/hero-student-focus.jpg"
                  alt="Student in deep focus during exam preparation"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-sky-900/40 via-transparent to-emerald-400/25"
                  aria-hidden
                />
                <p className="absolute bottom-5 left-5 right-5 text-sm font-semibold text-white drop-shadow-md">
                  Late nights. Timed sets. The quiet work behind a rank.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </MarketingSection>

      {/* Glass trust cards */}
      <MarketingSection className="border-y border-white/60 bg-gradient-to-b from-white/40 to-sky-50/20 py-12 backdrop-blur-sm">
        <motion.div {...fadeUp} className="grid gap-5 sm:grid-cols-3">
          <GlassCard>
            <p className="text-sm font-bold text-slate-900">Built for rankers</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">Every loop optimizes for list position — not comfort scores.</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-bold text-slate-900">Real exam pressure</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">Clock, hall noise, and fatigue — simulated before D-day.</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-bold text-slate-900">AI powered training</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">Nexa reads attempts and orders the next rep — like a ruthless coach.</p>
          </GlassCard>
        </motion.div>
      </MarketingSection>

      {/* Results */}
      <MarketingSection className="py-20 md:py-28">
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Social proof</h2>
          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Rank is not a mood. It is a trail of attempts.</p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Repetition under pressure, feedback you cannot argue with, and a system that refuses to let you stay almost there.
          </p>
        </motion.div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div
            {...fadeUp}
            className="relative sm:col-span-2 lg:col-span-2 lg:row-span-2 lg:min-h-[340px]"
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="relative h-full min-h-[280px] overflow-hidden rounded-2xl shadow-[0_24px_60px_-20px_rgba(14,165,233,0.35)] ring-2 ring-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,rgba(56,189,248,0.9),rgba(52,211,153,0.9))_border-box]"
            >
              <Image
                src="/images/rank-holder-success.jpg"
                alt="Top rank holder celebrating success"
                fill
                className="object-cover object-[center_25%]"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/15 to-transparent" aria-hidden />
              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
                <p className="text-lg font-bold leading-snug text-white drop-shadow-lg sm:text-xl">
                  This is what it looks like when the paper matches your preparation.
                </p>
                <span className="rounded-xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold tracking-wide text-white backdrop-blur-md">
                  AIR 23 · JEE Advanced
                </span>
              </div>
            </motion.div>
          </motion.div>
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <div className="flex h-full flex-col justify-center rounded-2xl border border-white/70 bg-white/50 p-8 shadow-lg backdrop-blur-xl">
              <p className="text-sm font-bold text-sky-700">The grind, on camera</p>
              <p className="mt-2 text-lg font-bold text-slate-900">Study like the rank list is watching</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Your hall is full of people who practiced easy. We keep the clock honest — speed and nerves trained, not hoped for.
              </p>
            </div>
          </motion.div>
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <div className="flex h-full flex-col justify-center rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/70 to-white/80 p-8 shadow-lg backdrop-blur-xl">
              <p className="text-sm font-bold text-emerald-700">What rankers fix in silence</p>
              <p className="mt-2 text-lg font-bold text-slate-900">Panic, pace, careless marks</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Most losses are hesitation under time. We surface those leaks early — before they cost you a year.
              </p>
            </div>
          </motion.div>
        </div>
      </MarketingSection>

      {/* Competition */}
      <MarketingSection className="pb-20 md:pb-28">
        <div
          ref={compRef}
          className="grid items-center gap-10 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/40 p-6 shadow-xl backdrop-blur-md sm:p-10 lg:grid-cols-2 lg:gap-14"
        >
          <motion.div style={{ y: compY }} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200 shadow-lg">
            <motion.div whileHover={{ scale: 1.04 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="relative h-full w-full">
              <Image
                src="/images/exam-hall-focus.jpg"
                alt="Exam hall focus under competition pressure"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-transparent" aria-hidden />
            </motion.div>
          </motion.div>
          <motion.div {...fadeUp}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">The competition section</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">The hall does not care how hard you tried yesterday.</h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              Thousands of sharp minds. One clock. ClassteacherAI trains you in the same pressure geometry — so when the seat
              shakes, your hands do not.
            </p>
            <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
              <li className="flex gap-2">
                <span className="text-emerald-500">●</span> Timed mocks that punish hesitation
              </li>
              <li className="flex gap-2">
                <span className="text-sky-500">●</span> Post-mortems that name the leak in one screen
              </li>
              <li className="flex gap-2">
                <span className="text-violet-500">●</span> Adaptive sets until the weak line holds
              </li>
            </ul>
          </motion.div>
        </div>
      </MarketingSection>

      {/* How it works */}
      <MarketingSection id="how" className="scroll-mt-28 pb-20 md:pb-28">
        <motion.div {...fadeUp} className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">How it works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Three moves the rank list rewards
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            A loop that turns every mistake into the next targeted rep — until accuracy and speed compound where it counts.
          </p>
        </motion.div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Enter test mode",
              body: "Full papers and sprints at real competition tempo. If it feels comfortable, you are not training for rank.",
              Icon: IconTarget,
            },
            {
              step: "2",
              title: "Break what costs rank",
              body: "Pinpoint topics and habits that leak marks — speed, carelessness, concept gaps — with evidence from every attempt.",
              Icon: IconCrack,
            },
            {
              step: "3",
              title: "Repeat until automatic",
              body: "Adaptive sets force the weak line until it holds under pressure. Nexa closes the loop with blunt orders.",
              Icon: IconLoop,
            },
          ].map(({ step, title, body, Icon }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.55,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
              }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="rounded-2xl border border-white/70 bg-white/50 p-8 shadow-lg backdrop-blur-xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 text-sky-700">
                <Icon className="h-6 w-6" />
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">Step {step}</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
            </motion.div>
          ))}
        </div>
      </MarketingSection>

      {/* Nexa */}
      <MarketingSection className="pb-20 md:pb-28">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-100/90 via-sky-50/80 to-emerald-50/70 px-6 py-14 shadow-[0_24px_80px_-24px_rgba(139,92,246,0.35)] sm:px-12 sm:py-16"
        >
          <motion.div
            className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-gradient-to-br from-violet-400/50 to-sky-400/30 blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4] }}
            transition={{ duration: 6, repeat: Infinity }}
            aria-hidden
          />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl ring-1 ring-violet-200/50">
              <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} className="relative h-full w-full">
                <Image
                  src="/images/nexa-ai-training.jpg"
                  alt="Nexa AI training interface"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-violet-950/40 to-transparent" aria-hidden />
              </motion.div>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Nexa AI</h2>
              <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Your AI trainer — not a chat toy.</p>
              <div className="mt-6 rounded-2xl border border-violet-200/80 bg-white/70 p-4 shadow-inner backdrop-blur-md">
                <NexaTypingLine />
              </div>
              <p className="mt-5 text-slate-600">
                Chatbots sympathize. Nexa diagnoses — pattern, pace, and the next drill before your next mock.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <blockquote className="rounded-2xl border border-white/80 bg-white/60 p-4 text-sm font-medium text-slate-800 backdrop-blur-md">
                  &ldquo;Same mistake three papers in a row — drill this concept first.&rdquo;
                </blockquote>
                <blockquote className="rounded-2xl border border-white/80 bg-white/60 p-4 text-sm font-medium text-slate-800 backdrop-blur-md">
                  &ldquo;Accurate but timid — shorter time, same difficulty next.&rdquo;
                </blockquote>
              </div>
            </div>
          </div>
        </motion.div>
      </MarketingSection>

      {/* Emotional */}
      <MarketingSection className="pb-20 md:pb-28">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900 shadow-2xl"
        >
          <div className="grid lg:grid-cols-2">
            <div className="relative min-h-[280px] lg:min-h-[420px]">
              <Image
                src="/images/family-success-moment.jpg"
                alt="Family celebrating student success"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 to-transparent lg:bg-gradient-to-t" aria-hidden />
            </div>
            <div className="flex flex-col justify-center px-8 py-14 text-white lg:px-12">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/90">The real outcome</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.5rem]">
                Rank is not just a number in your inbox. It is relief in your living room.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
                We build the discipline. You carry the result home — to the people who believed in the late nights.
              </p>
            </div>
          </div>
        </motion.div>
      </MarketingSection>

      {/* TopRank */}
      <MarketingSection id="toprank-system" className="scroll-mt-28 pb-20 md:pb-28">
        <motion.div
          {...fadeUp}
          className="overflow-hidden rounded-2xl bg-zinc-950 px-6 py-16 text-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] ring-1 ring-white/10 sm:px-10 sm:py-20"
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/90">Elite training track</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">TopRank — pain over excuses</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
              Aggressive difficulty, ruthless retries, discipline mode — the hardest loop we run for students who want a shot
              at the top.
            </p>
          </div>
          <ul className="mx-auto mt-12 grid max-w-2xl gap-4 text-left sm:grid-cols-2">
            {[
              "Continuous loop — no exit until the weak link breaks",
              "Adaptive difficulty that chases your ceiling",
              "Rank-level questions that punish half-knowledge",
              "Hardcore discipline mode — fewer escapes, more reps",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium leading-snug text-slate-100 backdrop-blur-sm"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <motion.div className="mt-10 flex justify-center" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/pricing#toprank"
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-10 text-base font-bold text-zinc-950 shadow-[0_12px_40px_-6px_rgba(52,211,153,0.5)] transition hover:shadow-[0_16px_48px_-6px_rgba(56,189,248,0.45)]"
            >
              Unlock TopRank
            </Link>
          </motion.div>
        </motion.div>
      </MarketingSection>

      {/* Pricing */}
      <MarketingSection id="pricing-preview" className="pb-20 md:pb-28">
        <motion.div {...fadeUp} className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Pricing</h2>
          <p className="mx-auto mt-4 max-w-xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Choose your intensity</p>
          <Link href="/pricing" className="mt-4 inline-block text-sm font-bold text-sky-700 hover:text-sky-900">
            Compare all features →
          </Link>
        </motion.div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_ORDER.map((key, i) => {
            const p = PLANS[key];
            const isTop = key === "TOPRANK";
            return (
              <motion.div
                key={key}
                id={isTop ? "toprank" : undefined}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <GradientBorderCard highlighted={isTop}>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{p.label}</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{p.name}</p>
                  <p className="mt-4 text-3xl font-bold tabular-nums text-slate-950">
                    {key === "BASIC" ? (
                      <>
                        15-day trial
                        <span className="mt-1 block text-lg font-semibold text-slate-600">
                          then ₹{p.priceInr.toLocaleString("en-IN")}/mo
                        </span>
                      </>
                    ) : (
                      <>
                        ₹{p.priceInr.toLocaleString("en-IN")}
                        <span className="text-base font-normal text-slate-500">/mo</span>
                      </>
                    )}
                  </p>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">{p.summary}</p>
                  <MarketingCta
                    variant={isTop ? "primary" : "secondary"}
                    className={`mt-6 h-12 w-full justify-center sm:w-auto ${isTop ? "!border-0 !bg-gradient-to-r !from-sky-600 !to-emerald-600 !shadow-lg hover:!from-sky-500 hover:!to-emerald-500" : "!shadow-none"}`}
                  >
                    {key === "BASIC" ? "Start free trial" : "Choose plan"}
                  </MarketingCta>
                </GradientBorderCard>
              </motion.div>
            );
          })}
        </div>
      </MarketingSection>

      {/* Final CTA */}
      <MarketingSection className="pb-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-16 text-center text-white shadow-2xl sm:py-20"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/20 via-transparent to-transparent" aria-hidden />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]">One honest paper. Then you will know.</h2>
          <p className="relative mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
            A timed attempt that exposes you — and a system that already tells you what to fix next.
          </p>
          <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-2xl shadow-[0_0_40px_-4px_rgba(56,189,248,0.55),0_0_60px_-8px_rgba(52,211,153,0.35)]"
            >
              <MarketingCta
                variant="light"
                className="relative h-14 bg-white px-10 text-base font-bold text-slate-900 hover:bg-slate-100"
              >
                Start Training
              </MarketingCta>
            </motion.div>
            <Link
              href="/pricing"
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/30 px-8 text-sm font-bold text-white transition hover:bg-white/10"
            >
              See plans
            </Link>
          </div>
        </motion.div>
      </MarketingSection>
    </main>
  );
}
