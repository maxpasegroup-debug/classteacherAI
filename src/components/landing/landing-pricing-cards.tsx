"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const tiers = [
  {
    name: "Starter",
    price: "₹499",
    blurb: "Entry to the loop. Build the habit.",
    highlight: false,
    href: "/auth/signup",
  },
  {
    name: "Pro",
    price: "₹1,999",
    blurb: "Full exams + Nexa depth.",
    highlight: false,
    href: "/auth/signup",
  },
  {
    name: "TopRank",
    price: "₹4,999",
    blurb: "Adaptive camp. Forced gains. Exam sim.",
    highlight: true,
    href: "/auth/signup",
  },
];

export function LandingPricingCards() {
  return (
    <section id="pricing" className="scroll-mt-24 border-t border-zinc-100 bg-zinc-50/40 px-4 py-16 md:scroll-mt-28 md:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Pricing</p>
        <h2 className="mx-auto mt-3 max-w-lg text-center text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
          One serious investment. Three levels of force.
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5">
          {tiers.map((tier, i) => {
            const cardInner = (
              <>
                {tier.highlight ? (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-emerald-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Most Powerful
                  </span>
                ) : null}
                <h3 className={`text-lg font-semibold ${tier.highlight ? "text-white" : "text-zinc-900"}`}>{tier.name}</h3>
                <p className={`mt-3 text-3xl font-semibold tracking-tight ${tier.highlight ? "text-white" : "text-zinc-950"}`}>
                  {tier.price}
                  <span className={`text-sm font-normal ${tier.highlight ? "text-zinc-400" : "text-zinc-500"}>/mo</span>
                </p>
                <p className={`mt-3 flex-1 text-sm leading-relaxed ${tier.highlight ? "text-zinc-300" : "text-zinc-600"}`}>
                  {tier.blurb}
                </p>
                <Link
                  href={tier.href}
                  className={`mt-8 flex min-h-[52px] items-center justify-center rounded-xl text-[15px] font-semibold transition active:scale-[0.99] ${
                    tier.highlight
                      ? "bg-white text-zinc-900 hover:bg-zinc-100"
                      : "bg-zinc-900 text-white hover:bg-zinc-800"
                  }`}
                >
                  Start Now
                </Link>
              </>
            );

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: tier.highlight ? -4 : -2 }}
                className={
                  tier.highlight
                    ? "rounded-2xl bg-gradient-to-br from-emerald-400/80 via-blue-500/75 to-violet-500/80 p-[2px] shadow-[0_0_60px_-12px_rgba(59,130,246,0.55),0_0_40px_-16px_rgba(16,185,129,0.45)]"
                    : ""
                }
              >
                <motion.article
                  className={`relative flex h-full flex-col overflow-hidden rounded-2xl p-6 md:p-8 ${
                    tier.highlight
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200/90 bg-white shadow-sm"
                  }`}
                >
                  {cardInner}
                </motion.article>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
