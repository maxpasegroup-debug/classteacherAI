"use client";

import Link from "next/link";
import { isTopRankPlan } from "@/lib/plan-tier";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RootCareFunnelNudge } from "@/components/rootcare-funnel-nudge";
import { UnlockRankJourneyModal } from "@/components/unlock-rank-journey-modal";
import { TopRankVisionStrip } from "@/components/toprank-vision-strip";
import type { TopRankVisionDto } from "@/components/toprank-hub-client";

type RankPayload = {
  daily?: { yourRank: number | null; totalRanked: number };
  formula?: string;
};

type AttemptRow = {
  id: string;
  examId: string;
  exam?: { title: string; subject?: string | null };
  accuracyPct: number;
  submittedAt: string | null;
};

type PreviewProps = {
  previewOnly: boolean;
  userName: string;
  plan: string;
  rankProfile?: {
    targetRank: number;
    level: string;
    trainingIntensity: string;
    weakAreaFocus: string;
    recommendedDailyQuestions: number;
    difficultyStartLevel: number;
  } | null;
};

export function StudentTodayClient({ previewOnly, userName, plan, rankProfile }: PreviewProps) {
  const [unlockOpen, setUnlockOpen] = useState(previewOnly);
  const [perfLoading, setPerfLoading] = useState(!previewOnly);
  const [perfError, setPerfError] = useState("");
  const [perfJson, setPerfJson] = useState<Record<string, unknown> | null>(null);
  const [rank, setRank] = useState<RankPayload | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [topVision, setTopVision] = useState<TopRankVisionDto | null | false>(false);

  useEffect(() => {
    setUnlockOpen(previewOnly);
  }, [previewOnly]);

  const loadHub = useCallback(async () => {
    if (previewOnly) return;
    setPerfLoading(true);
    setPerfError("");
    try {
      const promises: Promise<Response>[] = [
        fetch("/api/students/performance"),
        fetch("/api/rank/leaderboard"),
        fetch("/api/exam/attempts"),
      ];
      if (isTopRankPlan(plan)) {
        promises.push(fetch("/api/students/toprank/vision"));
      }
      const [pRes, rRes, aRes, vRes] = await Promise.all(promises);
      const pData = await pRes.json().catch(() => ({}));
      if (!pRes.ok) {
        setPerfJson(null);
        setPerfError(typeof pData.error === "string" ? pData.error : "Stats unavailable.");
      } else {
        setPerfJson(pData as Record<string, unknown>);
      }
      const rData = await rRes.json().catch(() => ({}));
      if (rRes.ok) setRank(rData as RankPayload);
      const aData = await aRes.json().catch(() => ({}));
      if (aRes.ok && Array.isArray(aData.attempts)) setAttempts(aData.attempts as AttemptRow[]);

      if (isTopRankPlan(plan) && vRes) {
        const vData = await vRes.json().catch(() => ({}));
        if (vRes.ok && vData.topRank && vData.vision) {
          setTopVision(vData.vision as TopRankVisionDto);
        } else if (vRes.ok && vData.topRank) {
          setTopVision(null);
        } else {
          setTopVision(null);
        }
      }
    } catch {
      setPerfError("Network error.");
    } finally {
      setPerfLoading(false);
    }
  }, [previewOnly, plan]);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  const summary = perfJson?.summary as
    | {
        overallAccuracyPct?: number;
        streakDays?: number;
        totalAttempts?: number;
      }
    | undefined;

  const weakTopics = perfJson?.weakTopics as Array<{ subject?: string; tip?: string }> | undefined;
  const insights = perfJson?.insights as string[] | undefined;
  const rankPred = perfJson?.rankPrediction as { headline?: string } | undefined;
  const adv = perfJson?.advanced as { metrics?: { rankReadiness?: number } } | undefined;
  const tier = perfJson?.tier as string | undefined;

  const accuracyPct = summary?.overallAccuracyPct ?? null;
  const streak = summary?.streakDays ?? 0;
  const totalAttempts = summary?.totalAttempts ?? attempts.length;
  const rankReadiness = adv?.metrics?.rankReadiness ?? null;
  const dailyRank = rank?.daily?.yourRank;
  const rankPool = rank?.daily?.totalRanked ?? 0;

  const rankScoreDisplay = useMemo(() => {
    if (rankReadiness != null) return `${rankReadiness}`;
    if (accuracyPct != null) return `${Math.round(accuracyPct)}`;
    if (dailyRank != null) return `#${dailyRank}`;
    return "—";
  }, [rankReadiness, accuracyPct, dailyRank]);

  const lastAttempt = attempts[0];

  const mission = useMemo(() => {
    if (previewOnly) return "Subscribe to unlock missions tailored to your weak topics.";
    if (totalAttempts === 0) return "Baseline today: one timed practice set — log accuracy and enter the rank board.";
    const w = weakTopics?.[0];
    if (w?.subject) return `Priority block: drill ${w.subject} for 15 minutes, then one mixed review set.`;
    return insights?.[0] ?? "Streak focus: one exam block plus one Nexa debrief while the pattern is fresh.";
  }, [previewOnly, totalAttempts, weakTopics, insights]);

  const nexaInsight = useMemo(() => {
    if (previewOnly) return "Unlock Pro or TopRank for Nexa coaching wired to your exam memory.";
    return (
      rankPred?.headline ??
      (isTopRankPlan(plan)
        ? "Open Nexa Trainer — use your latest debrief to plan the next rep."
        : "Open Nexa — ask for a tight plan on your weakest topic today.")
    );
  }, [previewOnly, rankPred, plan]);

  const weakAlert =
    weakTopics?.length && !previewOnly
      ? weakTopics
          .slice(0, 2)
          .map((w) => w.subject)
          .filter(Boolean)
          .join(" · ")
      : previewOnly
        ? "Visible after you subscribe."
        : totalAttempts === 0
          ? "Complete a set to surface weak topics."
          : "No critical gaps flagged — keep rotating subjects.";

  if (previewOnly) {
    return (
      <div className="relative space-y-4">
        <UnlockRankJourneyModal open={unlockOpen} onClose={() => setUnlockOpen(false)} />
        {!unlockOpen ? (
          <button
            type="button"
            onClick={() => setUnlockOpen(true)}
            className="fixed bottom-[4.25rem] left-1/2 z-50 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20"
          >
            Unlock training · ₹499
          </button>
        ) : null}
        <header className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">Training hub</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Today</h1>
          <p className="text-sm text-zinc-400">Preview · Hi {userName}</p>
        </header>
        <div className="pointer-events-none select-none space-y-4 blur-[2.5px] opacity-55">
          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/70">Mission</p>
            <p className="mt-2 text-sm text-zinc-200">{mission}</p>
            <div className="mt-3 h-10 rounded-xl bg-zinc-800/80" />
          </section>
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-[10px] font-semibold text-zinc-500">Continue</p>
            <div className="mt-3 h-9 rounded-xl bg-zinc-800/80" />
          </section>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl border border-zinc-800 bg-zinc-900/40" />
            ))}
          </div>
          <section className="rounded-2xl border border-violet-500/20 bg-violet-950/20 p-4">
            <p className="text-[10px] font-semibold text-violet-300/80">Nexa insight</p>
            <div className="mt-3 h-16 rounded-xl bg-zinc-800/60" />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">Training hub</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Today</h1>
        <p className="text-sm text-zinc-400">
          Hi {userName} ·{" "}
          {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
        </p>
      </header>

      {rankProfile ? (
        <section className="rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-500/15 to-emerald-500/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200/90">Your Rank Profile</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-zinc-100">
            <p>Target: Top {rankProfile.targetRank.toLocaleString("en-IN")}</p>
            <p>Level: {rankProfile.level}</p>
            <p>Strategy: {rankProfile.trainingIntensity}</p>
            <p>Focus: {rankProfile.weakAreaFocus}</p>
          </div>
          <p className="mt-2 text-xs text-zinc-300">
            Daily questions: {rankProfile.recommendedDailyQuestions} · Start level {rankProfile.difficultyStartLevel}
          </p>
        </section>
      ) : null}

      {isTopRankPlan(plan) && topVision !== false ? (
        topVision ? (
          <TopRankVisionStrip vision={topVision} />
        ) : (
          <Link
            href="/student/toprank"
            className="block rounded-2xl border border-violet-500/35 bg-violet-950/30 px-4 py-3 text-center text-sm font-semibold text-violet-200 transition hover:bg-violet-950/45"
          >
            TopRank: set your dream rank →
          </Link>
        )
      ) : null}

      <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-transparent p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/90">Today&apos;s mission</p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-100">{mission}</p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/student/exams"
            className="inline-flex w-full items-center justify-center rounded-xl bg-amber-400 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
          >
            Start training
          </Link>
          {isTopRankPlan(plan) ? (
            <Link
              href="/student/toprank"
              className="inline-flex w-full items-center justify-center rounded-xl border border-violet-500/40 py-2.5 text-xs font-semibold text-violet-200"
            >
              TopRank hub & vision
            </Link>
          ) : null}
        </div>
      </section>

      {!previewOnly ? (
        <RootCareFunnelNudge variant="dashboard" refreshKey={attempts.length} />
      ) : null}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Continue</p>
        {perfLoading ? (
          <p className="mt-2 text-sm text-zinc-500">Loading…</p>
        ) : lastAttempt?.exam?.title ? (
          <>
            <p className="mt-2 text-sm text-zinc-200">Last run · {lastAttempt.exam.title}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {lastAttempt.accuracyPct != null ? `${Math.round(lastAttempt.accuracyPct)}% accuracy` : null}
            </p>
            <Link
              href="/student/exams"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-zinc-600 bg-zinc-950 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Back to exam lab
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-zinc-400">No finished attempts yet.</p>
            <Link
              href="/student/exams"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-zinc-600 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Open exam training
            </Link>
          </>
        )}
      </section>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Accuracy</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {perfLoading ? "…" : accuracyPct != null ? `${Math.round(accuracyPct)}%` : "—"}
          </p>
          {tier === "basic" ? <p className="text-[9px] text-zinc-600">Basic</p> : null}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">TopRank · readiness</p>
          <p className="mt-1 text-lg font-semibold text-white">{perfLoading ? "…" : rankScoreDisplay}</p>
          {dailyRank != null && rankPool > 0 ? (
            <p className="text-[9px] text-zinc-500">
              #{dailyRank} of {rankPool} today
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Streak</p>
          <p className="mt-1 text-lg font-semibold text-white">{perfLoading ? "…" : streak}</p>
          <p className="text-[9px] text-zinc-500">days</p>
        </div>
      </section>

      <section className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-red-300/90">Weak areas</p>
        <p className="mt-2 text-sm text-zinc-200">{perfLoading ? "Loading…" : weakAlert}</p>
        <Link href="/student/performance" className="mt-3 inline-block text-xs font-semibold text-red-200 underline">
          Full analytics →
        </Link>
      </section>

      <section className="rounded-2xl border border-violet-500/25 bg-violet-950/25 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/90">Nexa insight</p>
        <p className="mt-2 text-sm text-zinc-200">{nexaInsight}</p>
        {perfError ? <p className="mt-1 text-xs text-amber-200/80">{perfError}</p> : null}
        <Link
          href="/nexa"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-violet-500 py-2.5 text-sm font-semibold text-white hover:bg-violet-400"
        >
          Open Nexa Trainer
        </Link>
      </section>
    </div>
  );
}
