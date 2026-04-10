"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-6 md:pb-24 md:pt-12 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-1/4 top-0 h-[min(85vh,520px)] w-[min(140vw,720px)] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.18)_0%,transparent_68%)]" />
        <div className="absolute -right-1/4 top-1/4 h-[min(70vh,480px)] w-[min(120vw,640px)] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.16)_0%,transparent_65%)]" />
        <div className="absolute bottom-0 left-1/2 h-px w-full max-w-3xl -translate-x-1/2 bg-gradient-to-r from-transparent via-zinc-200/80 to-transparent" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-8 lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-center lg:text-left"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500 md:text-xs">
            Rank-first training
          </p>
          <h1 className="mt-4 text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-zinc-950 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.06]">
            Train Like a Topper.
            <span className="block bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Rank Like a Champion.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-600 lg:mx-0 lg:text-lg">
            AI-powered training system that pushes you through continuous exam loops until rank becomes inevitable.
          </p>
          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/auth/signup"
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-zinc-900 px-8 text-[15px] font-semibold text-white shadow-[0_20px_50px_-24px_rgba(59,130,246,0.45)] transition hover:bg-zinc-800 hover:shadow-[0_24px_60px_-20px_rgba(16,185,129,0.35)] active:scale-[0.99]"
            >
              Start Training — ₹499
            </Link>
            <a
              href="#system"
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-zinc-200/90 bg-white/80 px-8 text-[15px] font-semibold text-zinc-800 backdrop-blur-sm transition hover:border-zinc-300 hover:bg-white active:scale-[0.99]"
            >
              Explore System
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto hidden h-[280px] w-full max-w-md lg:block lg:h-[360px] lg:max-w-none"
          aria-hidden
        >
          <div className="absolute inset-0 rounded-[2rem] border border-zinc-200/60 bg-gradient-to-br from-white/90 via-white/40 to-emerald-50/30 p-8 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.35)]" />
          <div className="absolute inset-[1px] rounded-[calc(2rem-1px)] bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/10" />
          <div className="absolute bottom-10 left-1/2 w-[85%] -translate-x-1/2 rounded-2xl border border-zinc-100 bg-white/90 p-5 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
              <span>Training loop</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Live</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" />
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-800">Streak · Accuracy · Readiness</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
