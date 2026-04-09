"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";

type ExamItem = {
  id: string;
  title: string;
  subject: string;
  durationMin: number;
  type: "MOCK" | "PRACTICE";
};

export type StartedQuestion = {
  id: string;
  question: string;
  options: string[];
};

export type ExamAttemptPayload = {
  attemptId: string;
  exam: ExamItem;
  questions: StartedQuestion[];
  deadlineAt: string;
  durationSec: number;
};

function formatTime(totalSec: number) {
  const mins = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(totalSec % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

type Props = {
  attempt: ExamAttemptPayload;
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
  activeQuestionIndex: number;
  setActiveQuestionIndex: Dispatch<SetStateAction<number>>;
  secondsLeft: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  banner?: ReactNode;
};

export function ExamTakingView({
  attempt,
  answers,
  setAnswers,
  activeQuestionIndex,
  setActiveQuestionIndex,
  secondsLeft,
  isSubmitting,
  onSubmit,
  banner,
}: Props) {
  const totalQuestions = attempt.questions.length;
  const hasTimedOut = secondsLeft <= 0;
  const answeredCount = attempt.questions.reduce((acc, q) => (answers[q.id] ? acc + 1 : acc), 0);
  const activeQuestion = attempt.questions[activeQuestionIndex] ?? null;

  return (
    <div className="space-y-3">
      {banner}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{attempt.exam.title}</p>
          <p className="text-xs text-slate-600">
            Question {Math.min(activeQuestionIndex + 1, totalQuestions)} of {totalQuestions} - Answered {answeredCount}/
            {totalQuestions}
          </p>
        </div>
        <div
          className={`rounded-md px-2 py-1 text-sm font-semibold ${
            hasTimedOut ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {hasTimedOut ? "Time up" : formatTime(secondsLeft)}
        </div>
      </div>

      {activeQuestion ? (
        <div className="rounded-xl border border-slate-100 p-3">
          <p className="text-sm font-medium text-slate-900">{activeQuestion.question}</p>
          <div className="mt-3 space-y-2">
            {activeQuestion.options.map((opt) => (
              <label
                key={`${activeQuestion.id}-${opt}`}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name={activeQuestion.id}
                  value={opt}
                  checked={answers[activeQuestion.id] === opt}
                  onChange={() => setAnswers((prev) => ({ ...prev, [activeQuestion.id]: opt }))}
                  disabled={hasTimedOut || isSubmitting}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No questions returned for this exam.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={activeQuestionIndex <= 0}
          onClick={() => setActiveQuestionIndex((idx) => Math.max(0, idx - 1))}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={activeQuestionIndex >= totalQuestions - 1}
          onClick={() => setActiveQuestionIndex((idx) => Math.min(totalQuestions - 1, idx + 1))}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
        >
          Next
        </button>
        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={isSubmitting || hasTimedOut || totalQuestions === 0}
          className="ml-auto rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit exam"}
        </button>
      </div>
    </div>
  );
}
