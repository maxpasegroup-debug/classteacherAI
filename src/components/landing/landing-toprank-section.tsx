"use client";

import { motion } from "framer-motion";

const bullets = [
  "Adaptive difficulty",
  "Weakness targeting",
  "Forced improvement loop",
  "Real exam simulation",
];

export function LandingTopRankSection() {
  return (
    <section id="toprank" className="relative scroll-mt-24 overflow-hidden px-4 py-20 md:scroll-mt-28 md:py-28 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-zinc-950" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-90">
        <div className="absolute -left-1/3 top-0 h-[500px] w-[500px] rounded-full bg-blue-600/25 blur-[100px]" />
        <div className="absolute -right-1/4 bottom-0 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-[90px]" />
        <div className="absolute left-1/2 top-1/2 h-px w-[min(90vw,720px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-500"
        >
          TopRank
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="mt-4 bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl"
        >
          TopRank Training System
        </motion.h2>
        <motion.ul
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-10 max-w-md space-y-4 text-left"
        >
          {bullets.map((line, i) => (
            <motion.li
              key={line}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.07 }}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 shadow-[0_0_40px_-12px_rgba(16,185,129,0.35)] backdrop-blur-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/30 to-blue-500/30 text-sm font-semibold text-emerald-300">
                {i + 1}
              </span>
              <span className="text-[15px] font-medium text-zinc-200">{line}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
