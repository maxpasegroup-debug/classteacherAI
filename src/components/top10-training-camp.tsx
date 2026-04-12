"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { pickMotivation } from "@/lib/top10-motivation";
import { UpgradeGateModal } from "@/components/upgrade-gate-modal";
import { InlineNotice } from "@/components/ui-states";
import { ExamTakingView, type ExamAttemptPayload, type StartedQuestion } from "@/components/exam-taking-view";

type TrainerDebrief = {
  mistakeAnalysis: string;
  weakTopics: string[];
  nextAction: string;
  rankReadiness: number;
};

type TrainingLoopPayload = {
  weakAreas: string[];
  retryExamId: string;
  nextRecommendedExam: {
    id: string;
    title: string;
    subject: string;
    durationMin: number;
    reason: string;
  };
};

type SubmitPayload = {
  score: number;
  maxScore: number;
  accuracyPct: number;
  timeSpentSec: number;
  isTimeExceeded: boolean;
  trainingLoop?: TrainingLoopPayload;
  trainerDebrief?: TrainerDebrief;
  top10?: {
    enabled: boolean;
    mustRetry: boolean;
    weakTopics: string[];
    difficultyNext: number;
    streakPasses: number;
    passed: boolean;
    campMessage?: string;
  };
};

type TrainingMeta = {
  surpriseReal: boolean;
  dailyChallenge: boolean;
  difficulty: number;
  circuitCount: number;
};

type CampPhase = "lobby" | "exam" | "result" | "analysis" | "practice";

type Top10ServerState = {
  streakPasses: number;
  difficulty: number;
  circuitCount: number;
  weakTopics: string[];
  pendingRetry: boolean;
} | null;

function formatTime(totalSec: number) {
  const mins = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(totalSec % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function phaseProgress(
  phase: CampPhase,
  activeQuestionIndex: number,
  totalQuestions: number,
): number {
  switch (phase) {
    case "lobby":
      return 10;
    case "exam": {
      const t = Math.max(1, totalQuestions);
      const q = Math.min(activeQuestionIndex + 1, t);
      return 14 + (q / t) * 30;
    }
    case "result":
      return 52;
    case "analysis":
      return 72;
    case "practice":
      return 90;
    default:
      return 6;
  }
}

function DarkPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 shadow-inner backdrop-blur-sm sm:p-5">
      <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
      {description ? <p className="mt-1 text-sm leading-relaxed text-zinc-400">{description}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function Top10TrainingCamp() {
  const [phase, setPhase] = useState<CampPhase>("lobby");
  const [currentAttempt, setCurrentAttempt] = useState<ExamAttemptPayload | null>(null);
  const [trainingMeta, setTrainingMeta] = useState<TrainingMeta | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<SubmitPayload | null>(null);
  const [analysisLines, setAnalysisLines] = useState<string[]>([]);
  const [practiceLines, setPracticeLines] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [upgradeGate, setUpgradeGate] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [loadingStart, setLoadingStart] = useState(false);
  const [campState, setCampState] = useState<Top10ServerState>(null);

  const refreshCampState = useCallback(async () => {
    try {
      const res = await fetch("/api/exam/top10/state");
      const data = (await res.json().catch(() => ({}))) as {
        state?: unknown;
      };
      if (!res.ok) {
        setCampState(null);
        return;
      }
      if (!data.state) {
        setCampState(null);
        return;
      }
      const s = data.state as {
        streakPasses: number;
        difficulty: number;
        circuitCount: number;
        weakTopics: string[];
        pendingRetry: boolean;
      };
      setCampState({
        streakPasses: s.streakPasses,
        difficulty: s.difficulty,
        circuitCount: s.circuitCount,
        weakTopics: s.weakTopics ?? [],
        pendingRetry: s.pendingRetry,
      });
    } catch {
      setCampState(null);
    }
  }, []);

  useEffect(() => {
    void refreshCampState();
  }, [refreshCampState]);

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

  const streakPasses =
    lastResult?.top10?.streakPasses ?? campState?.streakPasses ?? 0;
  const difficultyTier =
    lastResult?.top10?.difficultyNext ?? trainingMeta?.difficulty ?? campState?.difficulty ?? 2;
  const circuitCount = trainingMeta?.circuitCount ?? campState?.circuitCount ?? 0;

  const motivation = useMemo(
    () =>
      pickMotivation({
        phase,
        circuitCount,
        streakPasses,
        questionIndex: activeQuestionIndex,
      }),
    [phase, circuitCount, streakPasses, activeQuestionIndex],
  );

  const progressPct = useMemo(
    () =>
      Math.min(
        100,
        phaseProgress(phase, activeQuestionIndex, currentAttempt?.questions.length ?? 1),
      ),
    [phase, activeQuestionIndex, currentAttempt?.questions.length],
  );

  const startCircuit = useCallback(async () => {
    setLoadingStart(true);
    setError("");
    try {
      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingMode: "top10" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        upgradeRequired?: boolean;
      };
      if (!res.ok) {
        const msg = data.message ?? data.error ?? "Could not start TopRank round.";
        setError(msg);
        if (data.upgradeRequired) setUpgradeGate({ open: true, message: msg });
        return;
      }
      const started = data as ExamAttemptPayload & { trainingMeta?: TrainingMeta };
      setCurrentAttempt({
        attemptId: started.attemptId,
        exam: started.exam,
        questions: started.questions as StartedQuestion[],
        deadlineAt: started.deadlineAt,
        durationSec: started.durationSec,
      });
      setTrainingMeta(started.trainingMeta ?? null);
      setAnswers({});
      setActiveQuestionIndex(0);
      setLastResult(null);
      setAnalysisLines([]);
      setPracticeLines([]);
      setSecondsLeft(Math.max(0, Math.floor((new Date(started.deadlineAt).getTime() - Date.now()) / 1000)));
      setPhase("exam");
      void refreshCampState();
    } catch {
      setError("Network error while starting.");
    } finally {
      setLoadingStart(false);
    }
  }, [refreshCampState]);

  async function submitExam(autoSubmit = false) {
    if (!currentAttempt) return;
    setIsSubmitting(true);
    setError("");
    try {
      const payloadAnswers = currentAttempt.questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] ?? "",
      }));
      const elapsedSec = Math.max(0, currentAttempt.durationSec - Math.max(0, secondsLeft));
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: currentAttempt.attemptId,
          answers: payloadAnswers,
          timeTakenSec: elapsedSec,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as SubmitPayload & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not submit.");
        return;
      }
      setLastResult(data);
      setCurrentAttempt(null);
      setTrainingMeta(null);
      setPhase("result");
      if (!autoSubmit) setSecondsLeft(0);
      void refreshCampState();
    } catch {
      setError("Network error while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function advance(action: "from_result" | "from_analysis" | "from_practice") {
    setError("");
    try {
      const res = await fetch("/api/exam/top10/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        upgradeRequired?: boolean;
        lines?: string[];
        phase?: string;
        readyToStart?: boolean;
      };
      if (!res.ok) {
        const msg = data.message ?? data.error ?? "Could not advance.";
        setError(msg);
        if (data.upgradeRequired) setUpgradeGate({ open: true, message: msg });
        return;
      }
      if (action === "from_result" && data.lines) {
        setAnalysisLines(data.lines as string[]);
        setPhase("analysis");
      } else if (action === "from_analysis" && data.lines) {
        setPracticeLines(data.lines as string[]);
        setPhase("practice");
      } else if (action === "from_practice") {
        await startCircuit();
      }
      void refreshCampState();
    } catch {
      setError("Network error.");
    }
  }

  const top10 = lastResult?.top10;
  const loop = lastResult?.trainingLoop;

  async function continueTrainingBar() {
    if (phase === "lobby") {
      await startCircuit();
      return;
    }
    if (phase === "exam") return;
    if (phase === "result" && lastResult) {
      if (lastResult.top10?.mustRetry) {
        await startCircuit();
        return;
      }
      await advance("from_result");
      return;
    }
    if (phase === "analysis") {
      await advance("from_analysis");
      return;
    }
    if (phase === "practice") {
      await advance("from_practice");
    }
  }

  const continueLabel =
    phase === "lobby"
      ? "Continue training"
      : phase === "exam"
        ? "In round…"
        : phase === "result" && top10?.mustRetry
          ? "Retry round"
          : "Continue training";

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-700/60 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black pb-28 text-zinc-100 shadow-[0_32px_80px_-32px_rgba(0,0,0,0.75)] ring-1 ring-white/[0.06]">
      {/* Sticky progress + motivation — always visible while scrolling */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto max-w-3xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/90">
            <span>TopRank Elite</span>
            <span className="tabular-nums text-zinc-400">{Math.round(progressPct)}% loop</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/90">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-violet-500 transition-[width] duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="text-sm font-medium leading-snug text-zinc-200">{motivation}</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                Pass streak · <span className="text-amber-300">{streakPasses}</span>
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                Tier <span className="text-white">{difficultyTier}</span>/5
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                Circuits · <span className="text-zinc-100">{circuitCount}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-4 py-6 sm:px-6">
        <header className="space-y-2 border-b border-white/5 pb-5">
          <h2 className="font-training-display text-2xl text-white sm:text-3xl">Rank training camp</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
            Core loop: exam → result → analysis → practice → re-test. Surprise simulations fire at random — exam-hall pace.
            Weak topics drive difficulty; fail the bar → mandatory retry.
          </p>
        </header>

        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}

        {phase === "lobby" ? (
          <DarkPanel
            title="Enter the loop"
            description="Adaptive difficulty from your last round — no dead ends."
          >
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center">
              <p className="text-sm font-medium text-zinc-200">Continue training</p>
              <p className="mt-1 text-xs text-zinc-500">
                One tap starts the next exam block. Finish → analysis → drill → re-test automatically.
              </p>
            </div>
            <button
              type="button"
              disabled={loadingStart}
              onClick={() => void startCircuit()}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/40 disabled:opacity-60"
            >
              {loadingStart ? "Opening circuit…" : "Start training circuit"}
            </button>
          </DarkPanel>
        ) : null}

        {phase === "exam" && currentAttempt ? (
          <DarkPanel title="Active round" description="Timer runs to zero — submit when ready.">
            {trainingMeta?.surpriseReal ? (
              <InlineNotice tone="error">Surprise simulation: shorter timer — exam-hall pace.</InlineNotice>
            ) : null}
            {trainingMeta?.dailyChallenge ? (
              <InlineNotice tone="success">Daily challenge — keep the streak alive.</InlineNotice>
            ) : null}
            {trainingMeta ? (
              <p className="text-xs text-zinc-500">
                Difficulty {trainingMeta.difficulty}/5 · Circuit #{trainingMeta.circuitCount + 1}
              </p>
            ) : null}
            <div className="mt-3 rounded-xl border border-white/5 bg-black/20 p-2">
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
            </div>
          </DarkPanel>
        ) : null}

        {phase === "result" && lastResult ? (
          <DarkPanel title="Round result" description={top10?.campMessage ?? "Outcome locked in."}>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Score", `${lastResult.score}/${lastResult.maxScore}`],
                ["Accuracy", `${lastResult.accuracyPct.toFixed(1)}%`],
                ["Time", formatTime(lastResult.timeSpentSec)],
                ["Bar", "65%+"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/10 bg-zinc-900/80 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{k}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{v}</p>
                </div>
              ))}
            </div>
            {top10 ? (
              <div className="mt-4 space-y-2 rounded-xl border border-violet-500/20 bg-violet-950/40 p-3 text-sm text-violet-100">
                <p>
                  Pass streak <span className="font-semibold text-amber-300">{top10.streakPasses}</span> · Next tier{" "}
                  <span className="font-semibold">{top10.difficultyNext}/5</span>
                </p>
                {top10.weakTopics.length > 0 ? (
                  <p className="text-xs text-violet-200/90">Focus: {top10.weakTopics.join(" · ")}</p>
                ) : null}
              </div>
            ) : null}

            {loop ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-sm text-zinc-300">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Weak areas (level)</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-200">
                  {loop.weakAreas.map((w, i) => (
                    <li key={`${w}-${i}`}>{w}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-zinc-500">
                  Next paper: <span className="font-medium text-zinc-200">{loop.nextRecommendedExam.title}</span> —{" "}
                  {loop.nextRecommendedExam.reason}
                </p>
              </div>
            ) : null}

            {lastResult.trainerDebrief ? (
              <div className="mt-4 space-y-3 rounded-xl border border-violet-400/20 bg-zinc-900/80 p-3 text-sm text-zinc-200">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-300">AI Trainer debrief</p>
                <p>{lastResult.trainerDebrief.mistakeAnalysis}</p>
                <ul className="list-inside list-disc text-zinc-300">
                  {lastResult.trainerDebrief.weakTopics.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <p className="font-medium text-white">{lastResult.trainerDebrief.nextAction}</p>
                <p className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-amber-200">
                  Rank readiness {lastResult.trainerDebrief.rankReadiness}/100
                </p>
              </div>
            ) : null}

            {top10?.mustRetry ? (
              <button
                type="button"
                onClick={() => void startCircuit()}
                className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/50"
              >
                Mandatory retry
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void advance("from_result")}
                className="mt-4 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"
              >
                Continue to analysis →
              </button>
            )}
          </DarkPanel>
        ) : null}

        {phase === "analysis" ? (
          <DarkPanel title="Coach analysis" description="Short read — then drill.">
            <ul className="list-inside list-disc space-y-2 text-sm text-zinc-300">
              {analysisLines.map((line, i) => (
                <li key={`a-${i}`}>{line}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void advance("from_analysis")}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white"
            >
              Continue to drill →
            </button>
          </DarkPanel>
        ) : null}

        {phase === "practice" ? (
          <DarkPanel title="Drill block" description="Focused reps — then re-test.">
            <ul className="space-y-2 text-sm text-zinc-300">
              {practiceLines.map((line, i) => (
                <p key={`p-${i}`} className="rounded-lg border border-amber-500/20 bg-amber-950/30 px-3 py-2">
                  {line}
                </p>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void advance("from_practice")}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white"
            >
              Re-test — re-enter loop
            </button>
          </DarkPanel>
        ) : null}

        <p className="text-center text-xs text-zinc-600">
          <Link href="/student/today" className="font-medium text-zinc-400 underline decoration-zinc-600 hover:text-zinc-300">
            Exit to Today hub
          </Link>
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/95 px-4 py-3 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            {phase === "exam"
              ? "Complete this round to advance the loop."
              : "One tap continues your training arc."}
          </p>
          <button
            type="button"
            disabled={phase === "exam" || loadingStart}
            onClick={() => void continueTrainingBar()}
            className="shrink-0 rounded-xl bg-gradient-to-r from-amber-400 to-violet-600 px-6 py-2.5 text-sm font-semibold text-zinc-950 shadow-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            {continueLabel}
          </button>
        </div>
      </div>

      <UpgradeGateModal
        open={upgradeGate.open}
        variant="toprank"
        message={upgradeGate.message}
        onClose={() => setUpgradeGate({ open: false, message: "" })}
      />
    </div>
  );
}
