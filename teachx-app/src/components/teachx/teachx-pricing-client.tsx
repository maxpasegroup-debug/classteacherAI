"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { TeachxPlanKey } from "@/lib/teachxPlanConfig";

type PlanCard = {
  key: TeachxPlanKey;
  label: string;
  priceInr: number;
  nexaAccess: boolean;
  dailyNexaLimit: number | null;
  businessAccess: boolean;
};

type Props = {
  currentPlan: TeachxPlanKey;
  free: PlanCard;
  pro: PlanCard;
  business: PlanCard;
};

export function TeachXPricingClient({ currentPlan, free, pro, business }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<TeachxPlanKey | null>(null);
  const [error, setError] = useState("");

  const upgrade = useCallback(
    async (plan: TeachxPlanKey) => {
      if (plan === "FREE") {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setLoading(plan);
      setError("");
      try {
        const res = await fetch("/api/teachx/upgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
          credentials: "include",
        });
        const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
        if (!res.ok || !data.success) {
          setError(typeof data.message === "string" ? data.message : "Could not upgrade.");
          return;
        }
        router.push("/dashboard");
        router.refresh();
      } catch {
        setError("Network error. Try again.");
      } finally {
        setLoading(null);
      }
    },
    [router],
  );

  const cards: {
    plan: PlanCard;
    highlight?: boolean;
    premium?: boolean;
    cta: string;
    action: () => void;
  }[] = [
    {
      plan: free,
      cta: "Continue",
      action: () => void upgrade("FREE"),
    },
    {
      plan: pro,
      highlight: true,
      cta: "Upgrade",
      action: () => void upgrade("PRO"),
    },
    {
      plan: business,
      premium: true,
      cta: "Go Business",
      action: () => void upgrade("BUSINESS"),
    },
  ];

  return (
    <div className="mt-10 space-y-6">
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">{error}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {cards.map(({ plan: p, highlight, premium, cta, action }) => {
          const isCurrent = currentPlan === p.key;
          return (
            <div
              key={p.key}
              className={`relative flex flex-col rounded-2xl border p-6 shadow-sm ${
                highlight
                  ? "border-blue-400/80 bg-gradient-to-b from-blue-50/90 to-white ring-2 ring-blue-500/25"
                  : premium
                    ? "border-emerald-300/80 bg-gradient-to-b from-emerald-50/80 to-white"
                    : "border-slate-200 bg-white"
              }`}
            >
              {highlight ? (
                <span className="absolute -top-3 left-4 rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Popular
                </span>
              ) : null}
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {p.priceInr === 0 ? "Free" : `₹${p.priceInr}`}
                {p.priceInr > 0 ? <span className="text-base font-medium text-slate-500">/mo</span> : null}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
                <li>{p.nexaAccess ? "Nexa AI included" : "Manual dashboard only — no Nexa"}</li>
                {p.nexaAccess && p.dailyNexaLimit != null ? (
                  <li>Up to {p.dailyNexaLimit} Nexa requests / day</li>
                ) : null}
                {p.nexaAccess && p.dailyNexaLimit == null ? <li>Full Nexa access</li> : null}
                {p.businessAccess ? <li>Business dashboard &amp; earning modules</li> : <li>—</li>}
              </ul>
              {isCurrent ? (
                <p className="mt-6 rounded-xl bg-emerald-100 py-2 text-center text-sm font-medium text-emerald-900">
                  Current plan
                </p>
              ) : (
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={action}
                  className={`mt-6 w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50 ${
                    highlight
                      ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md hover:opacity-95"
                      : premium
                        ? "border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {loading === p.key ? "Working…" : cta}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-500">
        Simplified upgrade is available in development. Production will use secure checkout.
      </p>
    </div>
  );
}
