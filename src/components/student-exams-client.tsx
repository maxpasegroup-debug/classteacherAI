"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isTopRankPlan } from "@/lib/plan-tier";
import { CardUI } from "@/components/card-ui";
import { ExamTakingView, type ExamAttemptPayload, type StartedQuestion } from "@/components/exam-taking-view";
import { RootCareFunnelNudge } from "@/components/rootcare-funnel-nudge";
import { Top10TrainingCamp } from "@/components/top10-training-camp";
import { TopRankAchieversBoard } from "@/components/toprank-achievers-board";
import { UpgradeGateModal } from "@/components/upgrade-gate-modal";
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

type QuestionReviewRow = {
  questionId: string;
  isCorrect: boolean;
  selected: string;
  correctAnswer: string;
  explanation: string;
  questionText: string;
  marksAwarded: number;
};

type RankCoachResult = {
  whatWentWrong: string;
  whatToFix: string;
  nextAction: string;
};

type TrainingSnapshot = {
  level: string;
  intensity: string;
  topWeak: string[];
  topStrong: string[];
  lastAccuracy: number | null;
  lastScore: number | null;
  focusMode?: boolean;
  focusTopic?: string;
  focusReason?: string;
};

type SubmitResult = {
  ok?: boolean;
  score: number;
  maxScore: number;
  accuracyPct: number;
  timeSpentSec: number;
  isTimeExceeded: boolean;
  engine?: string;
  questionReview?: QuestionReviewRow[];
  rankCoach?: RankCoachResult;
  trainingSnapshot?: TrainingSnapshot;
  trainerDebrief?: TrainerDebrief;
  trainingLoop?: TrainingLoopPayload;
};

type AttemptHistory = {
  id: string;
  engine?: string;
  examId: string;
  score: number;
  maxScore: number;
  startedAt: string;
  submittedAt: string | null;
  timeSpentSec: number;
  accuracyPct: number;
  exam: ExamItem;
};

type TrainingModeChoice = "select" | "practice" | "advanced" | "top10";

type Props = {
  exams: ExamItem[];
  plan: string;
  /** Matches structured `Question.exam` (e.g. NEET, JEE) for bank selection. */
  defaultExamTrack?: string | null;
};

export function StudentExamsClient({ exams, plan, defaultExamTrack }: Props) {
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

  const [feedback, setFeedback] = useState("");
  const [loopLoading, setLoopLoading] = useState(false);
  const [dailyTask, setDailyTask] = useState<string | null>(null);
  const [dailyPush, setDailyPush] = useState<string | null>(null);
  const [activeLoopMeta, setActiveLoopMeta] = useState<{ focusMode?: boolean; focusTopic?: string } | null>(null);
  const [rootcareRefresh, setRootcareRefresh] = useState(0);
  /** Topic-wise drill: keyword matched in question / explanation text. */
  const [topicFocus, setTopicFocus] = useState("");
  /** Pull easy / medium / hard into one session. */
  const [mixedDifficulty, setMixedDifficulty] = useState(true);
  const [upgradeGate, setUpgradeGate] = useState<{
    open: boolean;
    message: string;
    variant?: "default" | "toprank";
  }>({ open: false, message: "" });
  const [postSubmitRank, setPostSubmitRank] = useState<{ rank: number | null; percentile: number | null } | null>(
    null,
  );

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

  useEffect(() => {
    void loadAttempts();
  }, [loadAttempts]);

  useEffect(() => {
    if (!result) {
      setPostSubmitRank(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/performance");
        const data = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          overview?: { rank?: number | null; percentile?: number | null };
        };
        if (cancelled || !data.success) return;
        setPostSubmitRank({
          rank: data.overview?.rank ?? null,
          percentile: data.overview?.percentile ?? null,
        });
      } catch {
        if (!cancelled) setPostSubmitRank(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [result]);

  useEffect(() => {
    if (trainingMode !== "practice" && trainingMode !== "advanced") return;
    void fetch("/api/nexa/daily-task")
      .then(async (r) => {
        const d = (await r.json().catch(() => ({}))) as {
          task?: string;
          continuousPush?: string;
          upgradeRequired?: boolean;
          message?: string;
        };
        if (!r.ok) {
          if (d.upgradeRequired && typeof d.message === "string") {
            setUpgradeGate({ open: true, message: d.message, variant: "toprank" });
          }
          setDailyTask(null);
          setDailyPush(null);
          return;
        }
        setDailyTask(typeof d.task === "string" ? d.task : null);
        setDailyPush(typeof d.continuousPush === "string" ? d.continuousPush : null);
      })
      .catch(() => {
        setDailyTask(null);
        setDailyPush(null);
      });
  }, [trainingMode, rootcareRefresh, result]);

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

  const fetchTrainingNext = useCallback(
    async (daily: boolean) => {
      if (!selectedExam) {
        setRunError("Select an exam paper first (subject is used for the loop).");
        return;
      }
      setRunError("");
      setFeedback("");
      setResult(null);
      setLoopLoading(true);
      setIsSubmitting(false);
      try {
        const res = await fetch("/api/training/next", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            daily,
            exam: defaultExamTrack?.trim() || undefined,
            subject: selectedExam.subject,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
          upgradeRequired?: boolean;
        };
        if (!res.ok) {
          const msg = data.message ?? data.error ?? "Could not start conditioning loop.";
          setRunError(msg);
          if (data.upgradeRequired) setUpgradeGate({ open: true, message: msg, variant: "toprank" });
          return;
        }
        const started = data as ExamAttemptPayload & {
          engine?: string;
          questions: StartedQuestion[];
          trainingMeta?: { mix?: { focusMode?: boolean; focusTopic?: string } };
        };
        setCurrentAttempt({
          attemptId: started.attemptId,
          exam: started.exam,
          questions: started.questions,
          deadlineAt: started.deadlineAt,
          durationSec: started.durationSec,
          sessionMeta: started.sessionMeta,
        });
        const mix = started.trainingMeta?.mix;
        setActiveLoopMeta(mix?.focusMode ? { focusMode: true, focusTopic: mix.focusTopic } : null);
        setAnswers({});
        setActiveQuestionIndex(0);
        setSecondsLeft(Math.max(0, Math.floor((new Date(started.deadlineAt).getTime() - Date.now()) / 1000)));
        setFeedback(
          daily
            ? "Training loop started — adaptive mix from your topic memory."
            : "Weak-area fix set ready — stay sharp.",
        );
      } catch {
        setRunError("Network error while starting the training loop.");
      } finally {
        setLoopLoading(false);
      }
    },
    [defaultExamTrack, selectedExam],
  );

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
    setActiveLoopMeta(null);
    setIsSubmitting(false);
    try {
      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          exam: defaultExamTrack?.trim() || undefined,
          trainingMode: trainingMode === "practice" ? "practice" : "advanced",
          topicFocus: topicFocus.trim() || null,
          mixedDifficulty,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        upgradeRequired?: boolean;
      };
      if (!res.ok) {
        const msg = data.message ?? data.error ?? "Could not start exam.";
        setRunError(msg);
        if (data.upgradeRequired) setUpgradeGate({ open: true, message: msg, variant: "toprank" });
        return;
      }
      const started = data as ExamAttemptPayload & { engine?: string; questions: StartedQuestion[] };
      setCurrentAttempt(started);
      setActiveLoopMeta(null);
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
      const elapsedSec = Math.max(
        0,
        currentAttempt.durationSec - Math.max(0, secondsLeft),
      );
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: currentAttempt.attemptId,
          answers: payloadAnswers,
          timeTakenSec: elapsedSec,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRunError(data.error ?? "Could not submit exam.");
        return;
      }
      setResult(data as SubmitResult);
      await loadAttempts();
      setRootcareRefresh((k) => k + 1);
      setCurrentAttempt(null);
      setActiveLoopMeta(null);
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

  const showTop10Camp = trainingMode === "top10" && isTopRankPlan(plan);
  const showTop10Locked = trainingMode === "top10" && !isTopRankPlan(plan);

  const loop = result?.trainingLoop;
  const continueTrainingTarget = loop?.nextRecommendedExam ?? null;

  const trainingModeIsLoop = trainingMode === "practice" || trainingMode === "advanced";

  return (
    <div className={`space-y-6 ${trainingModeIsLoop ? "pb-[max(8.5rem,calc(env(safe-area-inset-bottom)+7.5rem))]" : ""}`}>
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
            {!isTopRankPlan(plan) ? (
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-amber-800/90">TopRank plan</p>
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
          <p className="text-center text-xs text-slate-600">
            <Link href="/student/toprank" className="font-medium text-violet-700 underline hover:text-violet-900">
              TopRank hub — vision board, dream rank, environment checklist
            </Link>
          </p>
          <Top10TrainingCamp />
        </div>
      ) : null}

      {trainingMode === "practice" || trainingMode === "advanced" ? (
        <CardUI
          variant="elite"
          title="TopRank conditioning loop"
          description="Test → analyze → fix → re-test. The next set weights weak topics, review, and strengths."
        >
          <p className="text-sm text-slate-600">
            Start Training builds the next timed round automatically from your profile and last results — no paper picker.
            Requires structured questions in the bank for your exam track and subject.
          </p>
          <button
            type="button"
            disabled={Boolean(currentAttempt) || loopLoading}
            onClick={() => void fetchTrainingNext(true)}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 sm:w-auto"
          >
            {loopLoading ? "Building…" : "Start training"}
          </button>
          {isTopRankPlan(plan) ? (
            <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-amber-900/80">
              TopRank plan: more items, higher intensity mix, tighter timer.
            </p>
          ) : null}
          {dailyTask ? (
            <div className="mt-4 rounded-xl border border-amber-200/60 bg-amber-50/90 px-3 py-2 text-sm text-amber-950">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-900/80">Daily task</p>
              <p className="mt-1 font-medium leading-snug">{dailyTask}</p>
              {dailyPush ? <p className="mt-2 text-xs text-amber-900/85">{dailyPush}</p> : null}
            </div>
          ) : null}
        </CardUI>
      ) : null}

      {trainingMode === "practice" || trainingMode === "advanced" ? (
        <CardUI
          variant="elite"
          title="Session"
          description={`${trainingMode === "practice" ? "Practice" : "Advanced"} — timer on, instant scoring.`}
        >
          {feedback ? <InlineNotice tone="success">{feedback}</InlineNotice> : null}
          {runError ? <InlineNotice tone="error">{runError}</InlineNotice> : null}
          {currentAttempt && activeLoopMeta?.focusMode ? (
            <InlineNotice tone="error">
              Focus Mode{activeLoopMeta.focusTopic ? ` — "${activeLoopMeta.focusTopic}"` : ""}: isolation set. Repeat
              until accuracy holds; no topic-hopping.
            </InlineNotice>
          ) : null}
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Topic drill (optional)</label>
                  <input
                    type="text"
                    value={topicFocus}
                    onChange={(e) => setTopicFocus(e.target.value)}
                    placeholder="e.g. quadratic, organic, motion…"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Prioritizes items containing this phrase. Expands to full paper if too few matches.
                  </p>
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <input
                    type="checkbox"
                    checked={mixedDifficulty}
                    onChange={(e) => setMixedDifficulty(e.target.checked)}
                    className="mt-1 rounded border-slate-300"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">Mixed difficulty</span>
                    <span className="block text-xs text-slate-600">
                      Blend easier and harder items in one timed round.
                    </span>
                  </span>
                </label>
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
          <CardUI
            title="Results"
            description="Auto evaluation — score, accuracy, weak topics, and your next paper."
          >
            <div className="mb-4 space-y-3 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-4">
              {postSubmitRank?.rank != null ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800/90">Your peer rank</p>
                  <p className="text-2xl font-bold text-slate-900">#{postSubmitRank.rank}</p>
                  {postSubmitRank.percentile != null ? (
                    <p className="text-xs text-slate-600">~{Math.round(postSubmitRank.percentile)}th percentile vs peers</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Rank updates after we sync your attempt…</p>
              )}
              {result.trainingLoop?.weakAreas?.length ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-amber-900/90">Weak signals</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-slate-800">
                    {result.trainingLoop.weakAreas.slice(0, 3).map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <button
                type="button"
                disabled={Boolean(currentAttempt)}
                onClick={() => void startExam(continueTrainingTarget?.id || selectedExamId)}
                className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50"
              >
                Start next challenge →
              </button>
            </div>
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
                <p className="text-xs text-slate-500">Timer</p>
                <p className={`text-xl font-semibold ${result.isTimeExceeded ? "text-red-600" : "text-emerald-700"}`}>
                  {result.isTimeExceeded ? "Exceeded" : "Within limit"}
                </p>
              </div>
            </div>
            {result.trainingSnapshot ? (
              <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/60 p-3 text-sm text-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">Conditioning state</p>
                <p className="mt-1">
                  Level <span className="font-semibold">{result.trainingSnapshot.level}</span> · Intensity{" "}
                  <span className="font-semibold">{result.trainingSnapshot.intensity}</span>
                </p>
                {result.trainingSnapshot.topWeak.length > 0 ? (
                  <p className="mt-2 text-xs text-slate-700">
                    <span className="font-semibold">Weak focus:</span> {result.trainingSnapshot.topWeak.join(", ")}
                  </p>
                ) : null}
                {result.trainingSnapshot.focusMode ? (
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    Focus Mode active
                    {result.trainingSnapshot.focusTopic ? ` → ${result.trainingSnapshot.focusTopic}` : ""}.
                    {result.trainingSnapshot.focusReason ? ` ${result.trainingSnapshot.focusReason}` : ""}
                  </p>
                ) : null}
              </div>
            ) : null}
            {result.rankCoach ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/90">
                  Nexa — rank coach debrief
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase text-red-300/90">What went wrong</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-100">{result.rankCoach.whatWentWrong}</p>
                <p className="mt-3 text-[10px] font-semibold uppercase text-amber-100/90">What to fix</p>
                <p className="mt-1 text-sm text-slate-100">{result.rankCoach.whatToFix}</p>
                <p className="mt-3 text-[10px] font-semibold uppercase text-emerald-300/90">Next action — no idle</p>
                <p className="mt-1 text-sm font-medium text-white">{result.rankCoach.nextAction}</p>
              </div>
            ) : null}
            {result.engine === "bank" ? (
              <div className="mt-4">
                <button
                  type="button"
                  disabled={loopLoading}
                  onClick={() => void fetchTrainingNext(false)}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-50 sm:w-auto"
                >
                  {loopLoading ? "Preparing…" : "Fix weak areas → next test"}
                </button>
              </div>
            ) : null}
            {result.questionReview && result.questionReview.length > 0 ? (
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Question review</p>
                <ul className="max-h-[min(70vh,28rem)] space-y-3 overflow-y-auto pr-1">
                  {result.questionReview.map((row, idx) => (
                    <li
                      key={row.questionId}
                      className={`rounded-xl border p-3 text-sm ${
                        row.isCorrect ? "border-emerald-100 bg-emerald-50/50" : "border-red-100 bg-red-50/40"
                      }`}
                    >
                      <p className="text-[11px] font-semibold text-slate-500">Q{idx + 1}</p>
                      <p className="mt-1 font-medium text-slate-900">{row.questionText}</p>
                      <p className="mt-2 text-xs text-slate-700">
                        <span className="font-semibold">Your answer:</span> {row.selected || "—"}
                      </p>
                      {!row.isCorrect ? (
                        <p className="mt-1 text-xs text-slate-700">
                          <span className="font-semibold">Correct:</span> {row.correctAnswer}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">{row.explanation}</p>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Marks: {row.marksAwarded > 0 ? `+${row.marksAwarded}` : row.marksAwarded}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {loop ? (
              <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Weak topics</p>
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
                </div>
                <button
                  type="button"
                  onClick={() => void startExam(loop.retryExamId || selectedExamId)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
                >
                  Retry this exam
                </button>
              </div>
            ) : null}
          </CardUI>
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
        <TopRankAchieversBoard refreshKey={rootcareRefresh} variant="exams" />
      ) : null}

      {trainingModeIsLoop ? (
        <div
          className="fixed inset-x-0 z-[45] border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.4)] backdrop-blur-md sm:px-6"
          style={{
            bottom: "max(4.35rem, calc(env(safe-area-inset-bottom) + 3.85rem))",
          }}
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-400">
              {continueTrainingTarget
                ? `Next up: ${continueTrainingTarget.title}`
                : result
                  ? "Use Continue training for the next round — no idle state."
                  : "Start a timed round — after every result you can continue in one tap."}
            </p>
            <button
              type="button"
              onClick={() => void startExam(continueTrainingTarget?.id || selectedExamId)}
              className="shrink-0 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md"
            >
              👉 Continue training
            </button>
          </div>
        </div>
      ) : null}

      <UpgradeGateModal
        open={upgradeGate.open}
        variant={upgradeGate.variant ?? "default"}
        message={upgradeGate.message}
        onClose={() => setUpgradeGate((g) => ({ ...g, open: false }))}
      />
    </div>
  );
}
