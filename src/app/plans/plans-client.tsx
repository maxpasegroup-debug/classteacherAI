"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type PlanCard = {
  key: string;
  name: string;
  priceInr: number;
  summary: string;
};

type Props = {
  basic: PlanCard;
  pro: PlanCard;
  elite: PlanCard;
  toprank: PlanCard;
  trialAlreadyUsed: boolean;
};

export function PlansClient({ basic, pro, elite, toprank, trialAlreadyUsed }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startTrial = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/start-trial", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        setError(typeof data.message === "string" ? data.message : "Could not start trial.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const cards: {
    tier: string;
    plan: PlanCard;
    highlight?: boolean;
    sub: string;
    priceLine: ReactNode;
    cta: string;
    onClick?: () => void | Promise<void>;
    href?: string;
  }[] = [
    {
      tier: "Basic",
      plan: basic,
      highlight: true,
      sub: "Start Free Trial (15 Days)",
      priceLine: <>Free 15 days, then ₹{basic.priceInr}/mo</>,
      cta: trialAlreadyUsed ? "Trial used — subscribe" : "Start Free Trial",
      onClick: trialAlreadyUsed ? undefined : startTrial,
      href: trialAlreadyUsed ? "/pricing#basic" : undefined,
    },
    {
      tier: "Pro",
      plan: pro,
      sub: "Adaptive training + Nexa",
      priceLine: <>₹{pro.priceInr}/mo</>,
      cta: "Upgrade Now",
      href: "/pricing#pro",
    },
    {
      tier: "Elite",
      plan: elite,
      sub: "Unlimited exams · full Nexa",
      priceLine: <>₹{elite.priceInr}/mo</>,
      cta: "Upgrade Now",
      href: "/pricing#elite",
    },
    {
      tier: "TopRank",
      plan: toprank,
      sub: "Hardcore rank loop",
      priceLine: <>₹{toprank.priceInr}/mo</>,
      cta: "Upgrade Now",
      href: "/pricing#toprank",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0b] px-4 py-8 text-zinc-100">
      <div className="mx-auto w-full max-w-lg space-y-6 sm:max-w-xl">
        <header className="space-y-1 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/90">ClassteacherAI</p>
          <h1 className="text-2xl font-semibold tracking-tight">Choose your plan</h1>
          <p className="text-sm text-zinc-400">Start with a 15-day Basic trial, or upgrade for more training power.</p>
        </header>

        {error ? (
          <p className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-center text-sm text-rose-100">{error}</p>
        ) : null}

        <div className="space-y-4">
          {cards.map((c) => (
            <div
              key={c.tier}
              className={`rounded-2xl border p-5 ${
                c.highlight ? "border-amber-400/50 bg-gradient-to-b from-amber-500/15 to-transparent ring-1 ring-amber-500/25" : "border-zinc-800 bg-zinc-900/40"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-white">{c.tier}</p>
                  <p className="text-xs text-zinc-400">{c.sub}</p>
                </div>
                {c.highlight ? (
                  <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                    Recommended
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-medium text-zinc-200">{c.priceLine}</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">{c.plan.summary}</p>
              {c.onClick ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={c.onClick}
                  className="mt-4 w-full rounded-xl bg-amber-400 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-60"
                >
                  {loading ? "Starting…" : c.cta}
                </button>
              ) : (
                <Link
                  href={c.href ?? "/pricing"}
                  className={`mt-4 flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold transition ${
                    c.highlight
                      ? "border border-zinc-600 text-zinc-100 hover:bg-zinc-800"
                      : "bg-zinc-100 text-zinc-950 hover:bg-white"
                  }`}
                >
                  {c.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-zinc-600">You can change or cancel anytime from pricing / account settings.</p>
      </div>
    </div>
  );
}
