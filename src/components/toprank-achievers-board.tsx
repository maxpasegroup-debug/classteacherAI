"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CardUI } from "@/components/card-ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui-states";

type AchieverRow = {
  rank: number;
  name: string;
  compositeScore: number;
  avgAccuracy: number;
  avgSecondsPerQuestion: number;
  speedScore: number;
  consistency: number;
};

type RankScopePayload = {
  top10: AchieverRow[];
  yourRank: number | null;
  yourScore: number | null;
  totalRanked: number;
  breakdown: {
    avgAccuracy: number;
    avgSecondsPerQuestion: number;
    speedScore: number;
    consistency: number;
  } | null;
};

type Criterion = { id: string; label: string; weightPct: number; hint: string };

export type RankBoardResponse = {
  label: string;
  tagline?: string;
  formula: string;
  leaderboardSize?: number;
  criteria?: Criterion[];
  daily: RankScopePayload;
  weekly: RankScopePayload;
  global: RankScopePayload;
};

type Props = {
  /** Bump after exam submit to refresh standings. */
  refreshKey?: number;
  variant?: "exams" | "hub";
};

export function TopRankAchieversBoard({ refreshKey = 0, variant = "exams" }: Props) {
  const [rankBoard, setRankBoard] = useState<RankBoardResponse | null>(null);
  const [rankScope, setRankScope] = useState<"daily" | "weekly" | "global">("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rank/leaderboard");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRankBoard(null);
        setError(typeof data.error === "string" ? data.error : "Could not load leaderboard.");
        return;
      }
      setRankBoard(data as RankBoardResponse);
    } catch {
      setRankBoard(null);
      setError("Network error while loading ranks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const tagline =
    rankBoard?.tagline ??
    "Top 10 learners by composite rank — accuracy, speed vs peers, and consistency.";
  const criteria = rankBoard?.criteria ?? [];
  const size = rankBoard?.leaderboardSize ?? 10;

  const inner = (
    <>
      <div
        className={`rounded-xl border px-3 py-2 text-sm ${
          variant === "hub"
            ? "border-violet-500/30 bg-violet-950/20 text-violet-100"
            : "border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-orange-50/50 text-amber-950"
        }`}
      >
        <p className="font-semibold leading-snug">{tagline}</p>
        {variant === "exams" ? (
          <p className="mt-1 text-xs opacity-90">{rankBoard?.formula ?? ""}</p>
        ) : (
          <p className="mt-1 text-xs text-violet-200/85">{rankBoard?.formula ?? ""}</p>
        )}
      </div>

      {criteria.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {criteria.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border px-2.5 py-1.5 text-left text-[11px] ${
                variant === "hub"
                  ? "border-zinc-700 bg-zinc-900/80 text-zinc-200"
                  : "border-slate-200 bg-slate-50 text-slate-800"
              }`}
              title={c.hint}
            >
              <span className="font-bold">{c.label}</span>
              <span className={variant === "hub" ? "text-zinc-400" : "text-slate-500"}> · {c.weightPct}%</span>
            </div>
          ))}
        </div>
      ) : null}

      <p
        className={`text-[11px] font-medium uppercase tracking-wide ${
          variant === "hub" ? "text-zinc-500" : "text-slate-500"
        }`}
      >
        Showing top {size} only · climb by lifting all three signals
      </p>

      <div className="flex flex-wrap gap-2">
        {(["daily", "weekly", "global"] as const).map((scope) => (
          <button
            key={scope}
            type="button"
            onClick={() => setRankScope(scope)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              rankScope === scope
                ? variant === "hub"
                  ? "bg-violet-500 text-white"
                  : "bg-slate-900 text-white"
                : variant === "hub"
                  ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {scope === "global" ? "Global (year)" : scope}
          </button>
        ))}
      </div>

      {loading ? <LoadingState label="Loading TopRank standings…" /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      {!loading && !error && rankBoard ? (
        (() => {
          const scopeData = rankBoard[rankScope];
          return (
            <div className="space-y-4">
              {scopeData.yourRank != null ? (
                <div
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    variant === "hub"
                      ? "border-emerald-500/35 bg-emerald-950/25 text-emerald-100"
                      : "border-violet-200 bg-violet-50/80 text-violet-950"
                  }`}
                >
                  <p className="font-semibold">
                    Your rank: #{scopeData.yourRank} of {scopeData.totalRanked}
                    {scopeData.yourScore != null ? (
                      <span className={variant === "hub" ? "font-normal text-emerald-200/90" : "font-normal text-violet-800"}>
                        {" "}
                        · composite {scopeData.yourScore}
                      </span>
                    ) : null}
                  </p>
                  {scopeData.breakdown ? (
                    <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <p className="font-semibold opacity-80">Accuracy</p>
                        <p>{scopeData.breakdown.avgAccuracy}%</p>
                      </div>
                      <div>
                        <p className="font-semibold opacity-80">Speed pts</p>
                        <p>{scopeData.breakdown.speedScore}</p>
                      </div>
                      <div>
                        <p className="font-semibold opacity-80">Consistency</p>
                        <p>{scopeData.breakdown.consistency}</p>
                      </div>
                    </div>
                  ) : null}
                  <p className={variant === "hub" ? "mt-1 text-[10px] text-emerald-200/70" : "mt-1 text-[10px] text-violet-800/80"}>
                    {scopeData.yourRank <= size
                      ? "You are in the TopRank spotlight for this window."
                      : `Break into the top ${size} with higher composite — train on Exams.`}
                  </p>
                </div>
              ) : (
                <p className={variant === "hub" ? "text-sm text-zinc-400" : "text-sm text-slate-600"}>
                  Submit attempts in this window to earn a rank ({scopeData.totalRanked} learners ranked).
                </p>
              )}

              {scopeData.top10.length === 0 ? (
                <EmptyState title="Board opening soon" detail="Complete a timed exam to enter TopRank Achievers." />
              ) : (
                <ul className="space-y-2">
                  {scopeData.top10.map((row, idx) => (
                    <li
                      key={`${rankScope}-${row.rank}-${row.name}`}
                      className={`rounded-xl border p-3 text-sm ${
                        idx === 0
                          ? variant === "hub"
                            ? "border-amber-400/50 bg-gradient-to-r from-amber-500/15 to-orange-600/10"
                            : "border-amber-300 bg-gradient-to-r from-amber-100/90 to-orange-50"
                          : variant === "hub"
                            ? "border-zinc-700 bg-zinc-950/40"
                            : "border-slate-100 bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p
                          className={`font-semibold ${
                            variant === "hub" ? "text-white" : "text-slate-900"
                          }`}
                        >
                          #{row.rank} {row.name}
                          {idx === 0 ? (
                            <span
                              className={
                                variant === "hub"
                                  ? "ml-2 text-xs font-normal text-amber-200"
                                  : "ml-2 text-xs font-normal text-amber-800"
                              }
                            >
                              TopRank #1
                            </span>
                          ) : null}
                        </p>
                        <p
                          className={`text-xs font-bold ${
                            variant === "hub" ? "text-violet-300" : "text-indigo-700"
                          }`}
                        >
                          {row.compositeScore} composite
                        </p>
                      </div>
                      <div
                        className={`mt-2 grid grid-cols-3 gap-x-2 gap-y-1 text-[11px] ${
                          variant === "hub" ? "text-zinc-300" : "text-slate-600"
                        }`}
                      >
                        <span title="Average accuracy in window">{row.avgAccuracy}% acc</span>
                        <span title="Speed score vs peers (higher = faster)">{row.speedScore} speed</span>
                        <span title="Consistency index">{row.consistency} steady</span>
                      </div>
                      <p
                        className={`mt-1 text-[10px] ${
                          variant === "hub" ? "text-zinc-500" : "text-slate-400"
                        }`}
                      >
                        Pace {row.avgSecondsPerQuestion}s / Q
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href="/student/exams"
                className={
                  variant === "hub"
                    ? "inline-flex w-full items-center justify-center rounded-xl bg-violet-500 py-2.5 text-sm font-semibold text-white hover:bg-violet-400"
                    : "inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                }
              >
                Train to climb the board →
              </Link>
            </div>
          );
        })()
      ) : null}
    </>
  );

  if (variant === "hub") {
    return (
      <section className="rounded-2xl border border-violet-500/25 bg-zinc-900/45 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-400/90">Competition</p>
        <h2 className="mt-1 text-lg font-semibold text-white">TopRank Achievers</h2>
        <p className="mt-1 text-xs text-zinc-400">Daily, weekly, and global top 10 — compete on accuracy, speed, and consistency.</p>
        <div className="mt-4 space-y-4">{inner}</div>
      </section>
    );
  }

  const examsTitle = rankBoard?.label ?? "TopRank Achievers";

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-1 shadow-md">
      <CardUI
        variant="elite"
        title={examsTitle}
        description="Aspire to the top 10. Rankings use your real attempts — same formula across Daily, Weekly, and Global windows."
      >
        {inner}
      </CardUI>
    </div>
  );
}
