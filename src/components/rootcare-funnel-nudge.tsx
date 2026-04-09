"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SNOOZE_KEY = "rootcare_funnel_snooze_until";

type FunnelPayload = {
  headline: string;
  examSubmittedCount: number;
  suggestNudge: boolean;
  free: { basicAssessment: boolean; careerMapping: boolean };
  advanced: { counseling: boolean; courseSuggestions: boolean };
};

type Props = {
  variant?: "dashboard" | "exams";
  refreshKey?: number;
};

export function RootCareFunnelNudge({ variant = "dashboard", refreshKey = 0 }: Props) {
  const [data, setData] = useState<FunnelPayload | null>(null);
  const [snoozed, setSnoozed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const until = localStorage.getItem(SNOOZE_KEY);
      if (until && Date.now() < Number.parseInt(until, 10)) {
        setSnoozed(true);
      } else {
        setSnoozed(false);
      }
    });
    void (async () => {
      try {
        const res = await fetch("/api/rootcare/funnel");
        const json = (await res.json().catch(() => null)) as FunnelPayload | null;
        if (!cancelled && res.ok && json) setData(json);
      } catch {
        if (!cancelled) setData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function snooze() {
    const week = 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + week));
    setSnoozed(true);
  }

  if (snoozed || !data?.suggestNudge) return null;

  const compact = variant === "exams";

  return (
    <div
      className={`rounded-2xl border border-teal-200/90 bg-gradient-to-r from-teal-50/90 via-white to-cyan-50/80 shadow-sm ${
        compact ? "px-4 py-3" : "px-5 py-4"
      }`}
      role="region"
      aria-label="Career direction suggestion"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">RootCare</p>
          <p className={`font-semibold text-slate-900 ${compact ? "text-base" : "text-lg"}`}>{data.headline}</p>
          <p className="text-sm text-slate-600">
            You have built exam rhythm ({data.examSubmittedCount} completed attempts). Explore career fit — free basics
            for everyone; Pro and TOP10 unlock counseling and course paths.
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <li>
              <span className="font-medium text-teal-900">Free:</span> basic assessment · career mapping
            </li>
            <li>
              <span className="font-medium text-slate-700">Advanced:</span>{" "}
              {data.advanced.counseling ? "counseling · " : ""}
              {data.advanced.courseSuggestions ? "course suggestions" : "upgrade for more"}
            </li>
          </ul>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link
            href="/rootcare"
            className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"
          >
            Explore RootCare
          </Link>
          <button
            type="button"
            onClick={snooze}
            className="text-xs font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-700"
          >
            Not now (remind in 7 days)
          </button>
        </div>
      </div>
    </div>
  );
}
