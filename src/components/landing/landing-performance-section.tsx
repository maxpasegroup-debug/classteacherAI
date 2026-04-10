"use client";

import { motion } from "framer-motion";

/** Decorative mock chart — visual only. */
function MockLineChart() {
  return (
    <svg viewBox="0 0 400 120" className="h-32 w-full max-w-md md:h-36" aria-hidden>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path
        d="M 0 95 Q 80 88 120 70 T 200 45 T 280 32 T 400 15 L 400 120 L 0 120 Z"
        fill="url(#chartFill)"
      />
      <path
        d="M 0 95 Q 80 88 120 70 T 200 45 T 280 32 T 400 15"
        fill="none"
        stroke="url(#chartStroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="chartStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgb(37, 99, 235)" />
          <stop offset="100%" stopColor="rgb(16, 185, 129)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MockBars() {
  const heights = [40, 62, 48, 78, 55, 88, 72];
  return (
    <div className="flex h-28 items-end justify-center gap-2 md:h-32 md:gap-3" aria-hidden>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          whileInView={{ height: `${h}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="w-5 rounded-t-md bg-gradient-to-t from-blue-600 to-emerald-500 md:w-6"
          style={{ maxHeight: "100%" }}
        />
      ))}
    </div>
  );
}

export function LandingPerformanceSection() {
  return (
    <section className="px-4 py-16 md:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Performance</p>
        <h2 className="mx-auto mt-3 max-w-lg text-center text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
          See the curve before the rank.
        </h2>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm lg:col-span-2"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Progress</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">Trajectory</p>
            <div className="mt-4">
              <MockLineChart />
            </div>
            <p className="mt-2 text-center text-xs text-zinc-500">Illustrative trend — your data builds in-app.</p>
          </motion.div>
          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Rank signal</p>
              <MockBars />
              <p className="mt-3 text-center text-2xl font-semibold tabular-nums text-zinc-900">↑ 12</p>
              <p className="text-center text-xs text-zinc-500">peer board (example)</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-blue-50/80 to-emerald-50/50 p-6 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Accuracy</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">84%</p>
              <p className="text-sm text-zinc-600">rolling average (example)</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
