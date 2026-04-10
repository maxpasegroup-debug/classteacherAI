"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function LandingCtaSection() {
  return (
    <section className="px-4 py-20 md:py-28 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-2xl font-semibold leading-snug tracking-tight text-zinc-900 sm:text-3xl md:text-[2rem]">
          Your rank is not a dream.
          <span className="mt-2 block bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            It&apos;s a system.
          </span>
        </p>
        <Link
          href="/auth/signup"
          className="mt-10 inline-flex min-h-[56px] items-center justify-center rounded-2xl bg-zinc-900 px-10 text-[15px] font-semibold text-white shadow-[0_24px_60px_-28px_rgba(59,130,246,0.4)] transition hover:bg-zinc-800 hover:shadow-[0_28px_70px_-28px_rgba(16,185,129,0.35)] active:scale-[0.99]"
        >
          Start Training Now
        </Link>
      </motion.div>
    </section>
  );
}
