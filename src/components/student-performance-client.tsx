"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CardUI } from "@/components/card-ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui-states";

type DailyRow = { day: string; label: string; avgAccuracy: number | null; attempts: number };
type SubjectRow = { subject: string; avgAccuracy: number; attempts: number; isWeak: boolean };
type WeakTopic = { subject: string; avgAccuracy: number; tip: string };

type BasicPayload = {
  tier: "basic";
  summary: {
    overallAccuracyPct: number;
    totalAttempts: number;
    streakDays: number;
  };
  subjects: SubjectRow[];
};

type AdvancedPayload = {
  metrics: {
    overallAccuracyPct: number;
    avgSecondsPerQuestion: number | null;
    consistencyScore: number | null;
    topicMasteryAvg: number | null;
    rankReadiness: number | null;
  };
  progressSeries: Array<{
    at: string;
    accuracyPct: number;
    subject: string;
    secondsPerQuestion: number | null;
  }>;
  topicHeatmap: Array<{
    topicKey: string;
    label: string;
    subject: string;
    masteryPct: number;
    answered: number;
  }>;
  dailyImprovement: Array<{
    day: string;
    label: string;
    avgAccuracy: number | null;
    attempts: number;
    consistencyScore: number | null;
    avgSecondsPerQuestion: number | null;
  }>;
  storedInsights: Array<{ message: string; kind: string; createdAt: string }>;
};

type FullPayload = {
  summary: {
    overallAccuracyPct: number;
    totalAttempts: number;
    weekOverWeekDeltaPct: number | null;
    streakDays: number;
    skillsAvgPct: number | null;
    last7Avg?: number | null;
    prev7Avg?: number | null;
  };
  daily: DailyRow[];
  weeklySeries: (number | null)[];
  weeklyLabels: string[];
  subjects: SubjectRow[];
  weakTopics: WeakTopic[];
  rankPrediction: {
    headline: string;
    detail: string;
    band: string;
    percentileBeat: number | null;
  };
  insights: string[];
  advanced?: AdvancedPayload;
};

type Payload = BasicPayload | FullPayload;

function isBasicPayload(p: Payload): p is BasicPayload {
  return "tier" in p && p.tier === "basic";
}

function heatClass(masteryPct: number) {
  if (masteryPct >= 78) return "border-emerald-200 bg-emerald-50 text-emerald-950";
  if (masteryPct >= 60) return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-red-200 bg-red-50 text-red-950";
}

function ProgressAccuracyChart({ series }: { series: AdvancedPayload["progressSeries"] }) {
  if (series.length < 2) {
    return <p className="text-sm text-slate-500">Add more attempts to unlock the accuracy trend line.</p>;
  }
  const accs = series.map((s) => s.accuracyPct);
  const minA = Math.min(...accs);
  const maxA = Math.max(...accs);
  const span = Math.max(maxA - minA, 12);
  const normY = (a: number) => 34 - ((a - minA) / span) * 28;
  const points = series
    .map((s, i) => {
      const x = 4 + (i / (series.length - 1)) * 92;
      const y = normY(s.accuracyPct);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 100 36" className="h-36 w-full" role="img" aria-label="Accuracy progress">
        <line x1="4" y1="34" x2="96" y2="34" stroke="rgb(226 232 240)" strokeWidth="0.3" />
        <polyline fill="none" points={points} stroke="rgb(79 70 229)" strokeWidth="0.5" strokeLinejoin="round" />
        {series.map((s, i) => (
          <circle
            key={`${s.at}-${i}`}
            cx={4 + (i / (series.length - 1)) * 92}
            cy={normY(s.accuracyPct)}
            r="0.9"
            fill="rgb(99 102 241)"
          >
            <title>{`${s.subject}: ${s.accuracyPct.toFixed(0)}%`}</title>
          </circle>
        ))}
      </svg>
      <p className="text-xs text-slate-500">
        Last {series.length} attempts · min {minA.toFixed(0)}% · max {maxA.toFixed(0)}%
      </p>
    </div>
  );
}

export function StudentPerformanceClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/students/performance");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not load performance.");
        setData(null);
        return;
      }
      setData(json as Payload);
    } catch {
      setError("Network error.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingState label="Loading your growth dashboard…" />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => void load()} />;
  }
  if (!data) {
    return null;
  }

  if (isBasicPayload(data)) {
    const { summary, subjects } = data;
    return (
      <div className="space-y-6">
        <p className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          You are on <span className="font-semibold">Basic</span>: summary metrics only.{" "}
          <Link href="/pricing" className="font-medium text-blue-700 underline">
            Upgrade to Pro
          </Link>{" "}
          for full analytics, charts, and AI insights.
        </p>
        <section className="grid gap-3 sm:grid-cols-3">
          <CardUI title="Overall accuracy" description="Across submitted mocks.">
            <p className="text-2xl font-semibold text-slate-900">{summary.overallAccuracyPct.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">{summary.totalAttempts} attempt(s)</p>
          </CardUI>
          <CardUI title="Streak" description="Consecutive days with at least one attempt.">
            <p className="text-2xl font-semibold text-slate-900">{summary.streakDays} day(s)</p>
          </CardUI>
        </section>
        <CardUI title="Subjects" description="Basic plan — top subjects by accuracy.">
          {subjects.length === 0 ? (
            <p className="text-sm text-slate-500">No subject breakdown yet.</p>
          ) : (
            <ul className="space-y-2">
              {subjects.map((s) => (
                <li key={s.subject} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-800">{s.subject}</span>
                  <span className="text-slate-600">
                    {s.avgAccuracy.toFixed(1)}% · {s.attempts}×
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardUI>
      </div>
    );
  }

  const full = data;
  const { summary, daily, weeklySeries, weeklyLabels, subjects, weakTopics, rankPrediction, insights, advanced } = full;
  const maxDaily = Math.max(1, ...daily.map((d) => (d.avgAccuracy != null ? d.avgAccuracy : 0)));
  const advDailyMax = Math.max(
    100,
    ...(advanced?.dailyImprovement.map((d) => d.avgAccuracy ?? 0) ?? [0]),
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CardUI title="Overall accuracy" description="Across all submitted mocks.">
          <p className="text-2xl font-semibold text-slate-900">{summary.overallAccuracyPct.toFixed(1)}%</p>
          <p className="text-xs text-slate-500">{summary.totalAttempts} attempt(s)</p>
        </CardUI>
        <CardUI title="This week vs last" description="Rolling 7-day average accuracy.">
          {summary.last7Avg != null ? (
            <p className="text-2xl font-semibold text-slate-900">{summary.last7Avg.toFixed(1)}%</p>
          ) : (
            <p className="text-sm text-slate-500">—</p>
          )}
          {summary.weekOverWeekDeltaPct != null ? (
            <p
              className={`text-sm font-medium ${summary.weekOverWeekDeltaPct >= 0 ? "text-emerald-700" : "text-amber-800"}`}
            >
              {summary.weekOverWeekDeltaPct >= 0 ? "↑" : "↓"} {Math.abs(summary.weekOverWeekDeltaPct).toFixed(1)} pts vs
              prior week
            </p>
          ) : (
            <p className="text-xs text-slate-500">Need activity in both weeks to compare.</p>
          )}
        </CardUI>
        <CardUI title="Streak" description="Consecutive days with at least one attempt.">
          <p className="text-2xl font-semibold text-slate-900">{summary.streakDays} day(s)</p>
        </CardUI>
        <CardUI title="Skills (avg)" description="Course progress across catalog.">
          <p className="text-2xl font-semibold text-slate-900">
            {summary.skillsAvgPct != null ? `${summary.skillsAvgPct.toFixed(0)}%` : "—"}
          </p>
          <Link href="/student/dashboard" className="text-xs font-medium text-blue-600">
            Update on dashboard →
          </Link>
        </CardUI>
      </section>

      {advanced ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <CardUI title="Accuracy %" description="Mean across all graded attempts.">
              <p className="text-2xl font-semibold text-slate-900">{advanced.metrics.overallAccuracyPct.toFixed(1)}%</p>
            </CardUI>
            <CardUI title="Speed" description="Average seconds per question (recent attempts).">
              <p className="text-2xl font-semibold text-slate-900">
                {advanced.metrics.avgSecondsPerQuestion != null
                  ? `${advanced.metrics.avgSecondsPerQuestion.toFixed(1)}s`
                  : "—"}
              </p>
              <p className="text-xs text-slate-500">Lower is faster</p>
            </CardUI>
            <CardUI title="Topic mastery" description="Weighted mastery across topic buckets.">
              <p className="text-2xl font-semibold text-slate-900">
                {advanced.metrics.topicMasteryAvg != null ? `${advanced.metrics.topicMasteryAvg.toFixed(0)}%` : "—"}
              </p>
            </CardUI>
            <CardUI title="Consistency" description="Stability of accuracy (higher = steadier).">
              <p className="text-2xl font-semibold text-slate-900">
                {advanced.metrics.consistencyScore != null ? `${advanced.metrics.consistencyScore.toFixed(0)}` : "—"}
              </p>
              <p className="text-xs text-slate-500">0–100 scale</p>
            </CardUI>
            <CardUI title="Rank readiness" description="Aligned with Nexa / recent exam form.">
              <p className="text-2xl font-semibold text-slate-900">
                {advanced.metrics.rankReadiness != null ? `${advanced.metrics.rankReadiness}/100` : "—"}
              </p>
            </CardUI>
          </section>

          <CardUI
            title="Progress graph"
            description="Accuracy % over recent attempts — stored per submit in your profile."
          >
            <ProgressAccuracyChart series={advanced.progressSeries} />
          </CardUI>

          <CardUI
            title="Weakness heatmap"
            description="Topic buckets (subject — level). Darker red = needs more reps."
          >
            {advanced.topicHeatmap.length === 0 ? (
              <EmptyState title="No topic data yet" detail="Complete exams with tagged questions to fill the heatmap." />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {[...advanced.topicHeatmap]
                  .sort((a, b) => a.masteryPct - b.masteryPct)
                  .map((t) => (
                    <div
                      key={t.topicKey}
                      className={`rounded-xl border px-3 py-2 text-sm ${heatClass(t.masteryPct)}`}
                    >
                      <p className="font-medium">{t.label}</p>
                      <p className="text-xs opacity-90">
                        {t.masteryPct.toFixed(0)}% mastery · {t.answered} Qs
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </CardUI>

          <CardUI
            title="Daily improvement"
            description="Stored daily aggregates — accuracy bar + consistency (when 2+ attempts that day)."
          >
            {advanced.dailyImprovement.length === 0 ? (
              <EmptyState title="No daily rows" detail="Your next attempts will populate this chart." />
            ) : (
              <div className="space-y-4">
                <div className="flex h-36 items-end gap-0.5 overflow-x-auto pb-1">
                  {advanced.dailyImprovement.map((d) => (
                    <div key={d.day} className="flex w-7 shrink-0 flex-col items-center gap-1">
                      <div className="flex h-28 w-full flex-col items-center justify-end gap-0.5">
                        {d.avgAccuracy != null ? (
                          <div
                            className="w-full rounded-t bg-indigo-500/90"
                            style={{ height: `${Math.max(8, (d.avgAccuracy / advDailyMax) * 100)}%` }}
                            title={`${d.avgAccuracy.toFixed(0)}% · ${d.attempts} attempts`}
                          />
                        ) : (
                          <div className="h-0.5 w-full bg-slate-200" />
                        )}
                        {d.consistencyScore != null ? (
                          <div
                            className="w-full rounded-sm bg-teal-400/80"
                            style={{
                              height: `${Math.min(28, Math.max(4, d.consistencyScore * 0.26))}px`,
                            }}
                            title={`Consistency ${d.consistencyScore.toFixed(0)}`}
                          />
                        ) : null}
                      </div>
                      <span className="rotate-[-48deg] whitespace-nowrap text-[8px] text-slate-400">
                        {d.label.slice(0, 5)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Indigo = avg accuracy that day · teal = same-day consistency (when calculable).
                </p>
              </div>
            )}
          </CardUI>

          {advanced.storedInsights.length > 0 ? (
            <CardUI
              title="Tracked insights"
              description="Generated from your stored performance history (e.g. subject lift, focus areas)."
            >
              <ul className="space-y-3">
                {advanced.storedInsights.map((s) => (
                  <li
                    key={`${s.createdAt}-${s.message}`}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm text-slate-800"
                  >
                    <span
                      className={`mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        s.kind === "improvement"
                          ? "bg-emerald-100 text-emerald-900"
                          : s.kind === "focus"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-blue-100 text-blue-900"
                      }`}
                    >
                      {s.kind}
                    </span>
                    {s.message}
                  </li>
                ))}
              </ul>
            </CardUI>
          ) : null}
        </>
      ) : null}

      <CardUI
        title="Improvement (last 7 days)"
        description="Daily average accuracy — gaps mean no attempts that day."
      >
        {weeklySeries.length === 0 ? (
          <EmptyState title="No weekly trend yet" detail="Complete a mock exam to see your weekly improvement graph." />
        ) : (
          <div className="flex h-36 items-end gap-1 sm:gap-2">
            {weeklySeries.map((v, i) => (
              <div key={weeklyLabels[i] ?? i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div className="flex h-28 w-full items-end justify-center rounded-t bg-slate-100">
                  {v != null ? (
                    <div
                      className="w-full max-w-[2.5rem] rounded-t bg-gradient-to-t from-blue-600 to-emerald-500 transition-all"
                      style={{ height: `${Math.max(10, v)}%` }}
                      title={`${v.toFixed(0)}%`}
                    />
                  ) : (
                    <div className="h-1 w-full rounded bg-slate-200" title="No attempts" />
                  )}
                </div>
                <span className="truncate text-[10px] text-slate-500">{weeklyLabels[i]}</span>
              </div>
            ))}
          </div>
        )}
      </CardUI>

      <CardUI title="Daily progress" description="Last 14 days — each bar is average accuracy that day.">
        {daily.length === 0 ? (
          <EmptyState title="No daily progress yet" detail="Submit a mock to start your day-by-day growth chart." />
        ) : (
        <div className="flex h-32 items-end gap-0.5 overflow-x-auto pb-1">
          {daily.map((d) => (
            <div key={d.day} className="flex w-6 shrink-0 flex-col items-center gap-1 sm:w-7">
              <div className="flex h-24 w-full items-end justify-center rounded-t bg-slate-50">
                {d.avgAccuracy != null ? (
                  <div
                    className="w-full rounded-t bg-blue-500/90"
                    style={{ height: `${Math.max(6, (d.avgAccuracy / maxDaily) * 100)}%` }}
                    title={`${d.avgAccuracy.toFixed(0)}%`}
                  />
                ) : (
                  <div className="h-0.5 w-full bg-slate-200" />
                )}
              </div>
              <span className="rotate-[-45deg] whitespace-nowrap text-[9px] text-slate-400">{d.label.slice(0, 6)}</span>
            </div>
          ))}
        </div>
        )}
      </CardUI>

      <div className="grid gap-4 lg:grid-cols-2">
        <CardUI title="Subject accuracy" description="Lower scores surface as focus areas.">
          {subjects.length === 0 ? (
            <p className="text-sm text-slate-500">No subject breakdown yet.</p>
          ) : (
            <ul className="space-y-2">
              {subjects.map((s) => (
                <li key={s.subject} className="flex items-center justify-between gap-2 text-sm">
                  <span className={s.isWeak ? "font-medium text-amber-900" : "text-slate-800"}>{s.subject}</span>
                  <span className="text-slate-600">
                    {s.avgAccuracy.toFixed(1)}% · {s.attempts}×
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardUI>

        <CardUI title="Weak topics" description="Detected from mock exams — practice these first.">
          {weakTopics.length === 0 ? (
            <p className="text-sm text-slate-500">No weak band detected — keep mixing subjects.</p>
          ) : (
            <ul className="space-y-3">
              {weakTopics.map((w) => (
                <li key={w.subject} className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm">
                  <p className="font-medium text-amber-950">{w.subject}</p>
                  <p className="text-xs text-amber-900/90">{w.avgAccuracy.toFixed(1)}% avg</p>
                  <p className="mt-1 text-xs text-slate-700">{w.tip}</p>
                </li>
              ))}
            </ul>
          )}
        </CardUI>
      </div>

      <CardUI
        title="Rank outlook"
        description="Peer comparison uses average mock accuracy across all students (practice data)."
      >
        <p className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-300">
          {rankPrediction.band}
        </p>
        <p className="mt-2 text-sm font-medium text-slate-900">{rankPrediction.headline}</p>
        <p className="mt-1 text-sm text-slate-600">{rankPrediction.detail}</p>
        {rankPrediction.percentileBeat != null ? (
          <p className="mt-2 text-xs text-slate-500">
            Estimated share of learners below your average score: ~{rankPrediction.percentileBeat.toFixed(0)}%.
          </p>
        ) : null}
        <Link href="/student/exams" className="mt-3 inline-block text-sm font-medium text-blue-600">
          Take another mock →
        </Link>
      </CardUI>

      <CardUI title="AI insights" description="Personalized tips from your numbers — no extra credits used.">
        <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
          {insights.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </CardUI>
    </div>
  );
}
