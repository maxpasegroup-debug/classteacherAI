"use client";

import Link from "next/link";
import { isTopRankPlan } from "@/lib/plan-tier";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RootCareFunnelNudge } from "@/components/rootcare-funnel-nudge";
import { UnlockRankJourneyModal } from "@/components/unlock-rank-journey-modal";
import { TopRankVisionStrip } from "@/components/toprank-vision-strip";
import { UpgradeGateModal } from "@/components/upgrade-gate-modal";
import type { TopRankVisionDto } from "@/components/toprank-hub-client";

type RankPayload = {
  daily?: { yourRank: number | null; totalRanked: number };
  formula?: string;
};

type HomePayload = {
  success: boolean;
  mission: {
    dailyExamTarget: number;
    todaySubmitted: number;
    progressPct: number;
    label: string;
  };
  streak: { days: number; label: string };
  rank: {
    peerRank: number | null;
    percentile: number | null;
    rankDeltaVsLast: number | null;
    lastSubject: string | null;
    overallAccuracyPct: number | null;
  };
  weakAreas: string[];
  targetExam: string | null;
  targetRankLabel: string | null;
  lastAttempt: { title: string; submittedAt: string } | null;
  notifications: string[];
};

type PreviewProps = {
  previewOnly: boolean;
  userName: string;
  plan: string;
  rankProfile?: {
    targetRankLabel: string;
    level: string;
    trainingIntensity: string;
    weakAreaFocus: string;
    recommendedDailyQuestions: number;
    difficultyStartLevel: number;
  } | null;
};

export function StudentTodayClient({ previewOnly, userName, plan, rankProfile }: PreviewProps) {
  const [unlockOpen, setUnlockOpen] = useState(previewOnly);
  const [loading, setLoading] = useState(!previewOnly);
  const [loadError, setLoadError] = useState("");
  const [home, setHome] = useState<HomePayload | null>(null);
  const [rankBoard, setRankBoard] = useState<RankPayload | null>(null);
  const [topVision, setTopVision] = useState<TopRankVisionDto | null | false>(false);
  const [hubRefresh, setHubRefresh] = useState(0);
  const [conversionOpen, setConversionOpen] = useState(false);

  useEffect(() => {
    setUnlockOpen(previewOnly);
  }, [previewOnly]);

  const loadHub = useCallback(async () => {
    if (previewOnly) return;
    setLoading(true);
    setLoadError("");
    try {
      const promises: Promise<Response>[] = [fetch("/api/students/home"), fetch("/api/rank/leaderboard")];
      if (isTopRankPlan(plan)) {
        promises.push(fetch("/api/students/toprank/vision"));
      }
      const results = await Promise.all(promises);
      const hRes = results[0]!;
      const rRes = results[1]!;
      const vRes = results[2];

      const hData = (await hRes.json().catch(() => ({}))) as HomePayload & { error?: string };
      if (!hRes.ok || !hData.success) {
        setHome(null);
        setLoadError(typeof hData.error === "string" ? hData.error : "Could not load home.");
      } else {
        setHome(hData);
        setHubRefresh((k) => k + 1);
      }

      const rData = await rRes.json().catch(() => ({}));
      if (rRes.ok) setRankBoard(rData as RankPayload);

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
      setLoadError("Network error.");
      setHome(null);
    } finally {
      setLoading(false);
    }
  }, [previewOnly, plan]);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  const dailyRank = rankBoard?.daily?.yourRank;
  const rankPool = rankBoard?.daily?.totalRanked ?? 0;

  const weakDisplay = useMemo(() => {
    if (!home?.weakAreas?.length) {
      return rankProfile?.weakAreaFocus ?? "Complete an exam to surface topic-level gaps.";
    }
    return home.weakAreas.slice(0, 3).join(" · ");
  }, [home?.weakAreas, rankProfile?.weakAreaFocus]);

  const streakFire = home?.streak.days ? `🔥 ${home.streak.days} day streak` : "🔥 Start your streak";

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
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">Home</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-zinc-400">Preview · Hi {userName}</p>
        </header>
        <div className="pointer-events-none select-none space-y-4 blur-[2.5px] opacity-55">
          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/70">Today&apos;s mission</p>
            <div className="mt-3 h-10 rounded-xl bg-zinc-800/80" />
          </section>
          <div className="h-12 rounded-xl bg-amber-400/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">Home</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-zinc-400">
          {userName} · {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
        </p>
      </header>

      {loadError ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-100">{loadError}</p>
      ) : null}

      {home?.notifications?.length ? (
        <ul className="space-y-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2">
          {home.notifications.map((n) => (
            <li key={n} className="text-xs text-zinc-300">
              · {n}
            </li>
          ))}
        </ul>
      ) : null}

      <section className="rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/12 to-transparent p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/90">Today&apos;s mission</p>
        <p className="mt-1 text-xs text-zinc-400">
          Target: {home?.mission.dailyExamTarget ?? 1} exam · Done today: {loading ? "…" : (home?.mission.todaySubmitted ?? 0)}
        </p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-500"
            style={{ width: `${loading ? 8 : home?.mission.progressPct ?? 0}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-zinc-200">{loading ? "Loading…" : home?.mission.label}</p>
        <p className="mt-1 text-xs font-medium text-amber-200/90">{streakFire}</p>
      </section>

      <Link
        href="/student/exams"
        className="flex w-full items-center justify-center rounded-2xl bg-amber-400 py-4 text-base font-bold tracking-tight text-zinc-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300"
      >
        Start exam
      </Link>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Your rank</p>
        {loading ? (
          <p className="mt-2 text-sm text-zinc-500">Loading…</p>
        ) : (
          <>
            <div className="mt-2 flex flex-wrap items-end gap-4">
              <div>
                <p className="text-[10px] text-zinc-500">Peer (last submit)</p>
                <p className="text-2xl font-bold tabular-nums text-white">
                  {home?.rank.peerRank != null ? `#${home.rank.peerRank}` : "—"}
                </p>
                {home?.rank.percentile != null ? (
                  <p className="text-xs text-zinc-400">~{Math.round(home.rank.percentile)}th pct</p>
                ) : null}
              </div>
              {dailyRank != null && rankPool > 0 ? (
                <div>
                  <p className="text-[10px] text-zinc-500">Leaderboard today</p>
                  <p className="text-xl font-semibold text-white">
                    #{dailyRank} <span className="text-sm font-normal text-zinc-500">/ {rankPool}</span>
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-[10px] text-zinc-500">Avg accuracy</p>
                <p className="text-xl font-semibold text-white">
                  {home?.rank.overallAccuracyPct != null ? `${Math.round(home.rank.overallAccuracyPct)}%` : "—"}
                </p>
              </div>
            </div>
            {home?.rank.rankDeltaVsLast != null && home.rank.rankDeltaVsLast !== 0 ? (
              <p className={`mt-2 text-xs font-medium ${home.rank.rankDeltaVsLast > 0 ? "text-emerald-400" : "text-amber-300"}`}>
                {home.rank.rankDeltaVsLast > 0
                  ? "↑ Rank improved vs last attempt (climbing the board)."
                  : "Rank slipped vs last round — one focused set usually reverses this."}
              </p>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">Submit exams to build a rank trend.</p>
            )}
            {!isTopRankPlan(plan) && home?.rank.peerRank != null ? (
              <button
                type="button"
                onClick={() => setConversionOpen(true)}
                className="mt-3 text-xs font-semibold text-amber-300 underline decoration-amber-500/50"
              >
                Train like top rankers →
              </button>
            ) : null}
          </>
        )}
      </section>

      <section className="rounded-2xl border border-rose-500/25 bg-rose-950/20 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-300/90">Weak areas</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-200">{loading ? "Loading…" : weakDisplay}</p>
        <Link href="/student/exams" className="mt-3 inline-block text-xs font-semibold text-rose-200 underline">
          Fix in next exam →
        </Link>
      </section>

      <section className="rounded-2xl border border-violet-500/30 bg-violet-950/25 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/90">Nexa trainer</p>
        <p className="mt-1 text-xs text-zinc-400">Quick debrief and next-step coaching.</p>
        <Link
          href="/nexa"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-violet-500 py-3 text-sm font-semibold text-white hover:bg-violet-400"
        >
          Open Nexa
        </Link>
      </section>

      {rankProfile ? (
        <section className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-3 text-xs text-zinc-300">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/80">Goal</p>
          <p className="mt-1">
            Target: {rankProfile.targetRankLabel} · {rankProfile.trainingIntensity}
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

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Last run</p>
        {loading ? (
          <p className="mt-2 text-sm text-zinc-500">Loading…</p>
        ) : home?.lastAttempt ? (
          <>
            <p className="mt-2 text-sm text-zinc-200">{home.lastAttempt.title}</p>
            <Link
              href="/student/exams"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-zinc-600 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Start next challenge
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-zinc-500">No finished attempt yet.</p>
            <Link
              href="/student/exams"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-zinc-600 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              First exam →
            </Link>
          </>
        )}
      </section>

      <RootCareFunnelNudge variant="dashboard" refreshKey={hubRefresh} />

      <UpgradeGateModal
        open={conversionOpen}
        variant="toprank"
        message="See how elite students loop exams, debriefs, and retries — without dead ends between sessions."
        onClose={() => setConversionOpen(false)}
      />
    </div>
  );
}
