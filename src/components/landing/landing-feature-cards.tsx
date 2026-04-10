"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function LandingFeatureCards() {
  return (
    <section id="system" className="scroll-mt-24 px-4 py-16 md:scroll-mt-28 md:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500"
        >
          Differentiation
        </motion.p>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mx-auto mt-3 max-w-xl text-center text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl"
        >
          Not coaching. Conditioning.
        </motion.h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2 md:gap-6">
          <motion.article
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-zinc-200/70 bg-zinc-50/50 p-6 shadow-sm md:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Traditional Coaching</p>
            <ul className="mt-5 space-y-3 text-[15px] leading-relaxed text-zinc-600">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                Passive learning
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                Notes
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                No real training
              </li>
            </ul>
          </motion.article>
          <motion.article
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="relative overflow-hidden rounded-2xl border border-zinc-900/10 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(59,130,246,0.28)] md:p-8"
          >
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-blue-400/20 to-emerald-400/20 blur-2xl" />
            <p className="relative text-xs font-semibold uppercase tracking-wider text-blue-700">ClassteacherAI</p>
            <ul className="relative mt-5 space-y-3 text-[15px] font-medium leading-relaxed text-zinc-800">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" />
                Continuous exam loops
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" />
                AI trainer
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" />
                Rank conditioning
              </li>
            </ul>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
