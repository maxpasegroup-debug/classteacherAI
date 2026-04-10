"use client";

import Link from "next/link";
import type { SubscriptionPlan } from "@prisma/client";
import { FormEvent, useCallback, useState } from "react";
import { TopRankAchieversBoard } from "@/components/toprank-achievers-board";
import { TOPRANK_EXAM_TRACKS } from "@/lib/toprank-vision";

export type TopRankVisionDto = {
  examTrack: string;
  targetRank: number;
  targetDate: string;
  dreamCollege: string;
  goalCardLine: string;
  envStudyTable: boolean;
  envDistractionFree: boolean;
  envDailySchedule: boolean;
};

type Props = {
  plan: SubscriptionPlan;
  paidTopRank: boolean;
  initialVision: TopRankVisionDto | null;
};

export function TopRankHubClient({ plan, paidTopRank, initialVision }: Props) {
  const [vision, setVision] = useState<TopRankVisionDto | null>(initialVision);
  const [examTrack, setExamTrack] = useState("NEET");
  const [targetRank, setTargetRank] = useState("5000");
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setUTCFullYear(d.getUTCFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [checkSaving, setCheckSaving] = useState(false);

  const eligible = plan === "TOP10" && paidTopRank;

  const patchChecklist = useCallback(async (patch: Partial<Pick<TopRankVisionDto, "envStudyTable" | "envDistractionFree" | "envDailySchedule">>) => {
    if (!vision) return;
    setCheckSaving(true);
    setError("");
    try {
      const res = await fetch("/api/students/toprank/vision", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not update.");
        return;
      }
      if (data.vision) setVision(data.vision as TopRankVisionDto);
    } finally {
      setCheckSaving(false);
    }
  }, [vision]);

  async function submitDreamRank(e: FormEvent) {
    e.preventDefault();
    if (!eligible) return;
    setSaving(true);
    setError("");
    try {
      const rank = parseInt(targetRank.replace(/\D/g, ""), 10);
      const res = await fetch("/api/students/toprank/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examTrack,
          targetRank: rank,
          targetDate: new Date(targetDate + "T12:00:00.000Z").toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save.");
        return;
      }
      if (data.vision) setVision(data.vision as TopRankVisionDto);
    } finally {
      setSaving(false);
    }
  }

  if (!paidTopRank || plan !== "TOP10") {
    return (
      <div className="space-y-4">
        <header className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-400/90">TopRank</p>
          <h1 className="text-2xl font-semibold text-white">Training system</h1>
          <p className="text-sm text-zinc-400">Continuous rank-production loop — TopRank members only.</p>
        </header>
        <div className="rounded-2xl border border-violet-500/25 bg-violet-950/30 p-4">
          <p className="text-sm text-zinc-200">Unlock adaptive difficulty, surprise exam simulations, forced retries, and vision-based goals.</p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-violet-500 py-3 text-sm font-semibold text-white"
          >
            View TopRank plan
          </Link>
        </div>
      </div>
    );
  }

  if (!vision) {
    return (
      <div className="space-y-5">
        <header className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-200/80">TopRank</p>
          <h1 className="text-2xl font-semibold text-white">What is your dream rank?</h1>
          <p className="text-sm text-zinc-400">We turn this into a permanent vision board and tune your training loop.</p>
        </header>

        <form onSubmit={submitDreamRank} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div>
            <label className="text-xs font-medium text-zinc-500">Exam</label>
            <select
              value={examTrack}
              onChange={(e) => setExamTrack(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white"
            >
              {TOPRANK_EXAM_TRACKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Target rank (AIR / overall)</label>
            <input
              type="text"
              inputMode="numeric"
              value={targetRank}
              onChange={(e) => setTargetRank(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white"
              placeholder="e.g. 2500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Target date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white"
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-violet-600 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Build my vision board"}
          </button>
        </form>

        <TopRankAchieversBoard variant="hub" />
      </div>
    );
  }

  const envDone = vision.envStudyTable && vision.envDistractionFree && vision.envDailySchedule;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-200/80">TopRank</p>
        <h1 className="text-2xl font-semibold text-white">Vision & loop</h1>
        <p className="text-sm text-zinc-400">Exam → result → analysis → practice → re-test. No dead ends.</p>
      </header>

      <section className="rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/10 via-zinc-900/40 to-violet-950/30 p-4 ring-1 ring-white/5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/90">Goal card</p>
        <p className="mt-2 text-lg font-semibold leading-snug text-white">{vision.goalCardLine}</p>
        <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Rank target</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-white">AIR {vision.targetRank.toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Dream college / band</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-200">{vision.dreamCollege}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Target date: {new Date(vision.targetDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Environment setup</p>
        <p className="mt-1 text-xs text-zinc-500">Lock these in to protect daily depth work.</p>
        <ul className="mt-3 space-y-2">
          {(
            [
              ["envStudyTable", "Study table setup", vision.envStudyTable],
              ["envDistractionFree", "Distraction-free zone", vision.envDistractionFree],
              ["envDailySchedule", "Daily schedule blocked", vision.envDailySchedule],
            ] as const
          ).map(([key, label, checked]) => (
            <li key={key}>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={checkSaving}
                  onChange={(e) => void patchChecklist({ [key]: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-600"
                />
                <span className="text-sm text-zinc-200">{label}</span>
              </label>
            </li>
          ))}
        </ul>
        {envDone ? (
          <p className="mt-3 text-xs font-medium text-emerald-400/90">Environment locked in — ship reps.</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/90">Core loop</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-zinc-300">
          <li>Timed exam (surprise simulations fire randomly)</li>
          <li>Instant result + weak-topic detection</li>
          <li>Analysis + drill</li>
          <li>Re-test — difficulty adapts; fail the bar → forced retry</li>
        </ol>
        <Link
          href="/student/exams"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-violet-600 py-3 text-sm font-semibold text-zinc-950"
        >
          Continue training — exam lab
        </Link>
        <p className="mt-2 text-center text-xs text-zinc-500">
          Open <span className="text-zinc-300">TopRank Elite</span> mode in exams for the full camp UI.
        </p>
      </section>

      <TopRankAchieversBoard variant="hub" />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
