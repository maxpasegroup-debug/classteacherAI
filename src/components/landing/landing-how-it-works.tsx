"use client";

import { motion } from "framer-motion";

const steps = [
  { title: "Set your rank goal", icon: TargetIcon },
  { title: "AI analyzes your level", icon: SparkIcon },
  { title: "Continuous training loop", icon: LoopIcon },
  { title: "Improve daily", icon: TrendIcon },
  { title: "Achieve rank", icon: TrophyIcon },
];

function TargetIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" className="text-blue-500/80" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" className="text-emerald-500/80" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" className="text-zinc-900" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2l1.2 4.2L17 8l-3.8 1.8L12 14l-1.2-4.2L7 8l3.8-1.8L12 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9L18 14z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
function LoopIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 10h10a4 4 0 010 8H8M17 14H7a4 4 0 010-8h9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-teal-600"
      />
      <path d="M19 8l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-teal-600" />
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 16l4-4 4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600" />
      <path d="M16 8h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 21h8M12 17v4M7 7h10v4a5 5 0 01-10 0V7zM5 7H3v2a3 3 0 003 3m13-5h2v2a3 3 0 01-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-amber-600"
      />
    </svg>
  );
}

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-zinc-100 bg-white/40 px-4 py-16 backdrop-blur-sm md:scroll-mt-28 md:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">How it Works</p>
        <h2 className="mx-auto mt-3 max-w-lg text-center text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
          Five moves. One system.
        </h2>
        <ol className="mt-12 flex flex-col gap-3 md:flex-row md:flex-wrap md:justify-center md:gap-4">
          {steps.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="flex min-h-[56px] flex-1 items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white px-5 py-4 shadow-sm md:min-h-0 md:min-w-[180px] md:flex-col md:items-start md:py-6 md:px-6"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-zinc-900">
                <step.icon />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">0{i + 1}</span>
                <p className="mt-0.5 text-[15px] font-medium leading-snug text-zinc-900">{step.title}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
