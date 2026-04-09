"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SubscriptionPlan } from "@prisma/client";
import { CardUI } from "@/components/card-ui";
import { ExamTakingView, type ExamAttemptPayload } from "@/components/exam-taking-view";
import { RootCareFunnelNudge } from "@/components/rootcare-funnel-nudge";
import { Top10TrainingCamp } from "@/components/top10-training-camp";
import { EmptyState, ErrorState, InlineNotice, LoadingState } from "@/components/ui-states";

type ExamItem = {
  id: string;
  title: string;
  subject: string;
  durationMin: number;
  type: "MOCK" | "PRACTICE";
};

type TrainerDebrief = {
  mistakeAnalysis: string;
  weakTopics: string[];
  nextAction: string;
  rankReadiness: number;
};

type NextRecommendedExam = {
  id: string;
  title: string;
  subject: string;
  durationMin: number;
  reason: string;
};

type TrainingLoopPayload = {
  weakAreas: string[];
  retryExamId: string;
  nextRecommendedExam: NextRecommendedExam;
};

type SubmitResult = {
  score: number;
  maxScore: number;
  accuracyPct: number;
  timeSpentSec: number;
  isTimeExceeded: boolean;
  trainerDebrief?: TrainerDebrief;
  trainingLoop?: TrainingLoopPayload;
};

type AttemptHistory = {
  id: string;
  examId: string;
  score: number;
  maxScore: number;
  startedAt: string;
  submittedAt: string | null;
  timeSpentSec: number;
  accuracyPct: number;
  exam: ExamItem;
};

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

type RankBoardResponse = {
  label: string;
  formula: string;
  daily: RankScopePayload;
  weekly: RankScopePayload;
  global: RankScopePayload;
};

type TrainingModeChoice = "select" | "practice" | "advanced" | "top10";

type Props = {
  exams: ExamItem[];
  plan: SubscriptionPlan;
};

export function StudentExamsClient({ exams, plan }: Props) {
  /** Default to practice so leaderboard and exam flow are one tap away. */
  const [trainingMode, setTrainingMode] = useState<TrainingModeChoice>("practice");
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id ?? "");
  const [currentAttempt, setCurrentAttempt] = useState<ExamAttemptPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [runError, setRunError] = useState("");

  const [history, setHistory] = useState<AttemptHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const [rankBoard, setRankBoard] = useState<RankBoardResponse | null>(null);
  const [rankScope, setRankScope] = useState<"daily" | "weekly" | "global">("daily");
  const [rankLoading, setRankLoading] = useState(false);
  const [rankError, setRankError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rootcareRefresh, setRootcareRefresh] = useState(0);

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === selectedExamId) ?? null,
    [exams, selectedExamId],
  );

  const loadAttempts = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const res = await fetch("/api/exam/attempts");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHistoryError(data.error ?? "Could not load attempts.");
        setHistory([]);
        return;
      }
      setHistory(data.attempts ?? []);
    } catch {
      setHistoryError("Network error while loading attempts.");
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadRankBoard = useCallback(async () => {
    setRankLoading(true);
    setRankError("");
    try {
      const res = await fetch("/api/rank/leaderboard");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRankError(data.error ?? "Could not load rank board.");
        setRankBoard(null);
        return;
      }
      setRankBoard(data as RankBoardResponse);
    } catch {
      setRankError("Network error while loading ranks.");
      setRankBoard(null);
    } finally {
      setRankLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAttempts();
  }, [loadAttempts]);

  useEffect(() => {
    if (trainingMode === "practice" || trainingMode === "advanced") {
      void loadRankBoard();
    }
  }, [trainingMode, loadRankBoard]);

  useEffect(() => {
    if (!currentAttempt) return;
    const timer = window.setInterval(() => {
      const left = Math.max(
        0,
        Math.floor((new Date(currentAttempt.deadlineAt).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(left);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [currentAttempt]);

  useEffect(() => {
    if (!currentAttempt || secondsLeft > 0 || isSubmitting) return;
    void submitExam(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, currentAttempt, isSubmitting]);

  async function startExam(examIdOverride?: string) {
    const examId = examIdOverride ?? selectedExamId;
    if (!examId) {
      setRunError("Please select an exam.");
      return;
    }
    if (trainingMode !== "practice" && trainingMode !== "advanced") {
      setRunError("Pick Practice or Advanced mode first.");
      return;
    }
    if (examIdOverride) setSelectedExamId(examId);
    setRunError("");
    setFeedback("");
    setResult(null);
    setIsSubmitting(false);
    try {
      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          trainingMode: trainingMode === "practice" ? "practice" : "advanced",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRunError(data.error ?? "Could not start exam.");
        return;
      }
      const started = data as ExamAttemptPayload;
      setCurrentAttempt(started);
      setAnswers({});
      setActiveQuestionIndex(0);
      setSecondsLeft(Math.max(0, Math.floor((new Date(started.deadlineAt).getTime() - Date.now()) / 1000)));
      setFeedback("Exam started. Stay focused and pace yourself.");
    } catch {
      setRunError("Network error while starting exam.");
    }
  }

  async function submitExam(autoSubmit = false) {
    if (!currentAttempt) return;
    setIsSubmitting(true);
    setRunError("");
    setFeedback("");
    try {
      const payloadAnswers = currentAttempt.questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] ?? "",
      }));
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: currentAttempt.attemptId, answers: payloadAnswers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRunError(data.error ?? "Could not submit exam.");
        return;
      }
      setResult(data as SubmitResult);
      await loadAttempts();
      await loadRankBoard();
      setRootcareRefresh((k) => k + 1);
      setCurrentAttempt(null);
      if (!autoSubmit) setSecondsLeft(0);
      setFeedback(autoSubmit ? "Time was up, so your attempt was auto-submitted." : "Exam submitted successfully.");
    } catch {
      setRunError("Network error while submitting exam.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const avgAccuracyPct =
    history.length > 0 ? history.reduce((acc, item) => acc + item.accuracyPct, 0) / history.length : 0;
  const avgTimeSec =
    history.length > 0 ? history.reduce((acc, item) => acc + item.timeSpentSec, 0) / history.length : 0;

  function formatTime(totalSec: number) {
    const mins = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(totalSec % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  }

  const showTop10Camp = trainingMode === "top10" && plan === "TOP10";
  const showTop10Locked = trainingMode === "top10" && plan !== "TOP10";

  const loop = result?.trainingLoop;
  const continueTrainingTarget = loop?.nextRecommendedExam ?? null;

  const trainingModeIsLoop = trainingMode === "practice" || trainingMode === "advanced";

  return (
    <div className={`space-y-6 ${trainingModeIsLoop ? "pb-28" : ""}`}>
      <RootCareFunnelNudge variant="exams" refreshKey={rootcareRefresh} />

      <CardUI
        variant="elite"
        title="Training mode"
        description="Pick intensity. TOP10 opens the elite dark camp — progress, streaks, and a single continue arc."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setTrainingMode("practice");
              setCurrentAttempt(null);
              setResult(null);
            }}
            className={`rounded-2xl border p-4 text-left transition ${
              trainingMode === "practice"
                ? "border-indigo-300/80 bg-gradient-to-br from-indigo-50 to-white shadow-sm ring-1 ring-indigo-500/20"
                : "border-slate-200/90 bg-white hover:border-slate-300"
            }`}
          >
            <p className="text-sm font-semibold tracking-tight text-slate-900">Practice</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">Softer pacing — build confidence.</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setTrainingMode("advanced");
              setCurrentAttempt(null);
              setResult(null);
            }}
            className={`rounded-2xl border p-4 text-left transition ${
              trainingMode === "advanced"
                ? "border-indigo-300/80 bg-gradient-to-br from-indigo-50 to-white shadow-sm ring-1 ring-indigo-500/20"
                : "border-slate-200/90 bg-white hover:border-slate-300"
            }`}
          >
            <p className="text-sm font-semibold tracking-tight text-slate-900">Advanced</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">Harder mix — competition pressure.</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setTrainingMode("top10");
              setCurrentAttempt(null);
              setResult(null);
            }}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              trainingMode === "top10"
                ? "border-amber-400/90 bg-gradient-to-br from-amber-50 via-orange-50/80 to-violet-50/60 shadow-md ring-1 ring-amber-500/25"
                : "border-slate-200 bg-white hover:border-amber-200/80"
            }`}
          >
            <p className="text-sm font-semibold tracking-tight text-slate-900">
              TOP10 <span className="text-amber-700">Elite</span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">Dark camp · streaks · one-tap continue.</p>
            {plan !== "TOP10" ? (
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-amber-800/90">TOP10 plan</p>
            ) : null}
          </button>
        </div>
      </CardUI>

      {showTop10Locked ? (
        <CardUI title="TOP10 Rank Mode" description="Premium training camp — locked for your plan.">
          <p className="text-sm text-slate-600">
            Upgrade to TOP10 for adaptive difficulty, forced retries, daily challenges, and the continuous improvement
            loop.
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            View TOP10 pricing
          </Link>
        </CardUI>
      ) : null}

      {showTop10Camp ? (
        <div className="space-y-4">
          <Top10TrainingCamp />
        </div>
      ) : null}

      {trainingMode === "practice" || trainingMode === "advanced" ? (
        <CardUI
          variant="elite"
          title="Session"
          description={`${trainingMode === "practice" ? "Practice" : "Advanced"} — timer on, instant scoring.`}
        >
          {feedback ? <InlineNotice tone="success">{feedback}</InlineNotice> : null}
          {runError ? <InlineNotice tone="error">{runError}</InlineNotice> : null}
          {!currentAttempt ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[260px] flex-1">
                  <label className="mb-1 block text-xs text-slate-500">Choose exam</label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title} - {exam.subject} ({exam.durationMin}m)
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => void startExam()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Start exam
                </button>
              </div>
              {selectedExam ? (
                <p className="text-xs text-slate-500">
                  {selectedExam.subject} - {selectedExam.type} - strict duration {selectedExam.durationMin} minutes.
                </p>
              ) : null}
            </div>
          ) : (
            <ExamTakingView
              attempt={currentAttempt}
              answers={answers}
              setAnswers={setAnswers}
              activeQuestionIndex={activeQuestionIndex}
              setActiveQuestionIndex={setActiveQuestionIndex}
              secondsLeft={secondsLeft}
              isSubmitting={isSubmitting}
              onSubmit={() => void submitExam(false)}
            />
          )}
        </CardUI>
      ) : null}

      {result && trainingMode !== "top10" ? (
        <>
          <CardUI title="Result" description="Instant evaluation from your latest attempt.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Score</p>
                <p className="text-xl font-semibold text-slate-900">
                  {result.score}/{result.maxScore}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Accuracy</p>
                <p className="text-xl font-semibold text-slate-900">{result.accuracyPct.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Time spent</p>
                <p className="text-xl font-semibold text-slate-900">{formatTime(result.timeSpentSec)}</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Timer status</p>
                <p className={`text-xl font-semibold ${result.isTimeExceeded ? "text-red-600" : "text-emerald-700"}`}>
                  {result.isTimeExceeded ? "Exceeded" : "Within limit"}
                </p>
              </div>
            </div>
          </CardUI>
          {loop ? (
            <CardUI
              title="Keep training — no dead ends"
              description="Weak areas from this round, then retry or jump to the next recommended paper."
            >
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Weak areas</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-800">
                    {loop.weakAreas.map((w, i) => (
                      <li key={`${i}-${w}`}>{w}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-sm text-emerald-950">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Next recommended test</p>
                  <p className="mt-1 font-medium">{loop.nextRecommendedExam.title}</p>
                  <p className="text-xs text-emerald-900/90">
                    {loop.nextRecommendedExam.subject} · {loop.nextRecommendedExam.durationMin} min ·{" "}
                    {loop.nextRecommendedExam.reason}
                  </p>
                  <button
                    type="button"
                    onClick={() => void startExam(loop.nextRecommendedExam.id)}
                    className="mt-3 w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                  >
                    Start recommended test
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void startExam(loop.retryExamId)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
                  >
                    Retry this exam
                  </button>
                  <button
                    type="button"
                    onClick={() => void startExam(loop.nextRecommendedExam.id)}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Continue training
                  </button>
                </div>
              </div>
            </CardUI>
          ) : null}
          {result.trainerDebrief ? (
            <CardUI
              title="TOP10 AI Trainer"
              description="Mistake analysis, weak topics, and your rank readiness — synced to Nexa memory."
            >
              <div className="space-y-3 text-sm text-slate-800">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Mistake analysis</p>
                  <p className="mt-1">{result.trainerDebrief.mistakeAnalysis}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Weak topics</p>
                  <ul className="mt-1 list-inside list-disc">
                    {result.trainerDebrief.weakTopics.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Next action</p>
                  <p className="mt-1 font-medium text-slate-900">{result.trainerDebrief.nextAction}</p>
                </div>
                <p className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                  Your rank readiness is {result.trainerDebrief.rankReadiness}/100
                </p>
              </div>
            </CardUI>
          ) : null}
        </>
      ) : null}

      <CardUI title="Performance Tracking" description="Attempt history with accuracy and time analysis.">
        {historyLoading ? <LoadingState label="Loading attempts…" /> : null}
        {historyError ? <ErrorState message={historyError} /> : null}
        {!historyLoading && !historyError ? (
          <>
            <div className="mb-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Total attempts</p>
                <p className="text-lg font-semibold text-slate-900">{history.length}</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Average accuracy</p>
                <p className="text-lg font-semibold text-slate-900">{avgAccuracyPct.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Average time</p>
                <p className="text-lg font-semibold text-slate-900">{formatTime(avgTimeSec)}</p>
              </div>
            </div>
            {history.length === 0 ? (
              <EmptyState title="No submitted attempts yet" detail="Complete your first mock to unlock trend analytics." />
            ) : (
              <ul className="space-y-2">
                {history.map((item) => (
                  <li key={item.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                    <p className="font-medium text-slate-900">{item.exam.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(item.startedAt).toLocaleString()} - {item.score}/{item.maxScore} -{" "}
                      {item.accuracyPct.toFixed(1)}% - {formatTime(item.timeSpentSec)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </CardUI>

      {trainingMode === "practice" || trainingMode === "advanced" ? (
        <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-1 shadow-md">
          <CardUI
            title="TOP10 Achievers"
            description="Top 10 learners by composite rank — accuracy, speed (vs peers), and consistency. Daily, weekly, and global windows."
          >
            <p className="mb-3 text-xs text-slate-600">
              {rankBoard?.formula ?? "45% accuracy + 30% speed + 25% consistency"}
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {(["daily", "weekly", "global"] as const).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setRankScope(scope)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                    rankScope === scope
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {scope === "global" ? "Global (year)" : scope}
                </button>
              ))}
            </div>
            {rankLoading ? <LoadingState label="Loading ranks…" /> : null}
            {rankError ? <ErrorState message={rankError} /> : null}
            {!rankLoading && !rankError && rankBoard ? (
              (() => {
                const scopeData = rankBoard[rankScope];
                return (
                  <div className="space-y-4">
                    {scopeData.yourRank != null ? (
                      <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-3 py-2 text-sm text-violet-950">
                        <p className="font-semibold">
                          Your rank: #{scopeData.yourRank} of {scopeData.totalRanked}
                          {scopeData.yourScore != null ? (
                            <span className="font-normal text-violet-800"> · score {scopeData.yourScore}</span>
                          ) : null}
                        </p>
                        {scopeData.breakdown ? (
                          <p className="mt-1 text-xs text-violet-900/90">
                            Accuracy {scopeData.breakdown.avgAccuracy}% · {scopeData.breakdown.avgSecondsPerQuestion}s/Q ·
                            speed pts {scopeData.breakdown.speedScore} · consistency {scopeData.breakdown.consistency}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">
                        Submit attempts in this window to earn a rank ({scopeData.totalRanked} learners ranked).
                      </p>
                    )}
                    {scopeData.top10.length === 0 ? (
                      <EmptyState title="No ranks yet" detail="Complete a timed exam to enter the board." />
                    ) : (
                      <ul className="space-y-2">
                        {scopeData.top10.map((row, idx) => (
                          <li
                            key={`${rankScope}-${row.rank}-${row.name}`}
                            className={`rounded-xl border p-3 text-sm ${
                              idx === 0
                                ? "border-amber-300 bg-gradient-to-r from-amber-100/90 to-orange-50"
                                : "border-slate-100 bg-white"
                            }`}
                          >
                            <p className="font-semibold text-slate-900">
                              #{row.rank} {row.name}
                              {idx === 0 ? (
                                <span className="ml-2 text-xs font-normal text-amber-800">Leading achiever</span>
                              ) : null}
                            </p>
                            <p className="text-xs text-slate-600">
                              Score {row.compositeScore} · {row.avgAccuracy}% acc · {row.avgSecondsPerQuestion}s/Q ·
                              consistency {row.consistency}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()
            ) : null}
          </CardUI>
        </div>
      ) : null}

      {trainingModeIsLoop ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600">
              {continueTrainingTarget
                ? `Suggested next: ${continueTrainingTarget.title}`
                : "Pick a paper and start — the loop keeps going after every result."}
            </p>
            <button
              type="button"
              onClick={() => void startExam(continueTrainingTarget?.id)}
              className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md"
            >
              Continue training
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
