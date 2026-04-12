"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ChatLine = { from: "nexa" | "user"; text: string };

type Phase =
  | "intro"
  | "name"
  | "exam"
  | "exam_other"
  | "target_rank"
  | "level"
  | "study_hours"
  | "weakness"
  | "closing";

const INTRO = "Hi, I am Nexa. I will train you to become a top ranker.";
const CLOSING = "Your training system is ready.";

const PROMPTS: Record<Exclude<Phase, "intro" | "closing">, string> = {
  name: "Please confirm your name.",
  exam: "Which exam are you preparing for?",
  exam_other: "Please tell me the name of your exam.",
  target_rank: "What is your target rank?",
  level: "What is your current level?",
  study_hours: "How many hours can you study daily?",
  weakness: "What is your biggest weakness?",
};

const EXAM_OPTIONS = ["NEET", "JEE", "Other"] as const;
const LEVEL_OPTIONS = ["Beginner", "Average", "Advanced"] as const;
const WEAKNESS_OPTIONS = ["Focus", "Memory", "Speed", "Accuracy"] as const;

const TYPE_MS = 22;

function useTypewriter(fullText: string, runKey: string, onDone: () => void) {
  const [shown, setShown] = useState("");
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setShown("");
    if (!fullText) {
      doneRef.current();
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(fullText.slice(0, i));
      if (i >= fullText.length) {
        window.clearInterval(id);
        doneRef.current();
      }
    }, TYPE_MS);
    return () => window.clearInterval(id);
  }, [fullText, runKey]);

  return shown;
}

export function OnboardingChatClient({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [streamKey, setStreamKey] = useState("intro-0");
  const [streamDone, setStreamDone] = useState(false);
  const [awaitingUser, setAwaitingUser] = useState(false);

  const [nameInput, setNameInput] = useState(defaultName);
  const [rankInput, setRankInput] = useState("");
  const [hoursInput, setHoursInput] = useState("");
  const [otherExamInput, setOtherExamInput] = useState("");

  const [answers, setAnswers] = useState({
    name: "",
    exam: "",
    targetRank: "",
    level: "",
    studyHours: 0,
    weakness: "",
  });
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const streamText =
    phase === "intro"
      ? INTRO
      : phase === "closing"
        ? CLOSING
        : PROMPTS[phase as Exclude<Phase, "intro" | "closing">];

  const bumpStream = useCallback((next: Phase) => {
    setStreamDone(false);
    setAwaitingUser(false);
    setPhase(next);
    setStreamKey(`${next}-${Date.now()}`);
  }, []);

  const pushNexa = useCallback((text: string) => {
    setLines((prev) => [...prev, { from: "nexa", text }]);
  }, []);

  const pushUser = useCallback((text: string) => {
    setLines((prev) => [...prev, { from: "user", text }]);
  }, []);

  const onStreamFinished = useCallback(() => {
    setStreamDone(true);
    if (phase === "intro") {
      setAwaitingUser(true);
      return;
    }
    if (phase === "closing") {
      pushNexa(CLOSING);
      void (async () => {
        setLoading(true);
        setError("");
        const payload = answersRef.current;
        try {
          if (
            !payload.name ||
            !payload.exam ||
            !payload.targetRank ||
            !payload.level ||
            !payload.weakness ||
            !payload.studyHours
          ) {
            setError("Something went wrong. Please refresh and try again.");
            return;
          }
          const res = await fetch("/api/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: payload.name,
              exam: payload.exam,
              targetRank: payload.targetRank,
              level: payload.level,
              studyHours: payload.studyHours,
              weakness: payload.weakness,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError((data as { message?: string }).message ?? "Could not save your profile.");
            return;
          }
          router.push("/plans");
          router.refresh();
        } catch {
          setError("Network error. Please try again.");
        } finally {
          setLoading(false);
        }
      })();
      return;
    }
    setAwaitingUser(true);
  }, [phase, pushNexa, router]);

  const typed = useTypewriter(streamText, streamKey, onStreamFinished);

  const afterIntro = useCallback(() => {
    pushNexa(INTRO);
    bumpStream("name");
  }, [bumpStream, pushNexa]);

  const submitName = useCallback(() => {
    const n = nameInput.trim();
    if (!n) {
      setError("Please enter your name.");
      return;
    }
    setError("");
    pushNexa(PROMPTS.name);
    pushUser(n);
    setAnswers((a) => {
      const next = { ...a, name: n };
      answersRef.current = next;
      return next;
    });
    bumpStream("exam");
  }, [bumpStream, nameInput, pushNexa, pushUser]);

  const pickExam = useCallback(
    (choice: string) => {
      setError("");
      pushNexa(PROMPTS.exam);
      pushUser(choice);
      if (choice === "Other") {
        setOtherExamInput("");
        bumpStream("exam_other");
        return;
      }
      setAnswers((a) => {
        const next = { ...a, exam: choice };
        answersRef.current = next;
        return next;
      });
      bumpStream("target_rank");
    },
    [bumpStream, pushNexa, pushUser],
  );

  const submitOtherExam = useCallback(() => {
    const e = otherExamInput.trim();
    if (!e) {
      setError("Please name your exam.");
      return;
    }
    setError("");
    pushNexa(PROMPTS.exam_other);
    pushUser(e);
    setAnswers((a) => {
      const next = { ...a, exam: e };
      answersRef.current = next;
      return next;
    });
    bumpStream("target_rank");
  }, [bumpStream, otherExamInput, pushNexa, pushUser]);

  const submitRank = useCallback(() => {
    const t = rankInput.trim();
    if (!t || !/\d/.test(t)) {
      setError("Enter a target rank that includes a number (e.g. 500).");
      return;
    }
    setError("");
    pushNexa(PROMPTS.target_rank);
    pushUser(t);
    setAnswers((a) => {
      const next = { ...a, targetRank: t };
      answersRef.current = next;
      return next;
    });
    bumpStream("level");
  }, [bumpStream, pushNexa, pushUser, rankInput]);

  const pickLevel = useCallback(
    (level: string) => {
      setError("");
      pushNexa(PROMPTS.level);
      pushUser(level);
      setAnswers((a) => {
        const next = { ...a, level };
        answersRef.current = next;
        return next;
      });
      bumpStream("study_hours");
    },
    [bumpStream, pushNexa, pushUser],
  );

  const submitHours = useCallback(() => {
    const n = Number(hoursInput);
    if (!Number.isFinite(n) || n < 1 || n > 24) {
      setError("Enter daily study hours between 1 and 24.");
      return;
    }
    setError("");
    const h = Math.floor(n);
    pushNexa(PROMPTS.study_hours);
    pushUser(String(h));
    setAnswers((a) => {
      const next = { ...a, studyHours: h };
      answersRef.current = next;
      return next;
    });
    bumpStream("weakness");
  }, [bumpStream, hoursInput, pushNexa, pushUser]);

  const pickWeakness = useCallback(
    (w: string) => {
      setError("");
      pushNexa(PROMPTS.weakness);
      pushUser(w);
      setAnswers((a) => {
        const next = { ...a, weakness: w };
        answersRef.current = next;
        return next;
      });
      bumpStream("closing");
    },
    [bumpStream, pushNexa, pushUser],
  );

  const showTyping = streamText.length > 0 && typed.length < streamText.length;
  const totalSteps = 8;
  const stepIndex =
    phase === "intro"
      ? 0
      : phase === "name"
        ? 1
        : phase === "exam" || phase === "exam_other"
          ? 2
          : phase === "target_rank"
            ? 3
            : phase === "level"
              ? 4
              : phase === "study_hours"
                ? 5
                : phase === "weakness"
                  ? 6
                  : 7;
  const progress = Math.round(((stepIndex + (streamDone ? 1 : 0)) / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 px-4 py-6">
      <div className="mx-auto w-full max-w-lg md:max-w-xl">
        <div className="mb-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Nexa</span>
            <span>{Math.min(100, progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-800 transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        <div className="flex min-h-[60vh] flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex-1 space-y-3 overflow-y-auto pb-4">
            {lines.map((m, idx) => (
              <div key={`${m.from}-${idx}`} className={`flex ${m.from === "nexa" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    m.from === "nexa"
                      ? "bg-slate-100 text-slate-800"
                      : "bg-slate-900 text-white"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {streamText && !(phase === "closing" && streamDone) ? (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-2xl bg-slate-100 px-4 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm">
                  {typed}
                  {showTyping ? <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-slate-500 align-middle" /> : null}
                </div>
              </div>
            ) : null}
          </div>

          {showTyping ? (
            <p className="mb-3 text-center text-xs text-slate-400">Nexa is typing…</p>
          ) : null}

          <div className="border-t border-slate-100 pt-3">
            {phase === "intro" && streamDone && awaitingUser ? (
              <button
                type="button"
                onClick={afterIntro}
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                Continue
              </button>
            ) : null}

            {phase === "name" && streamDone && awaitingUser ? (
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitName();
                }}
              >
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-slate-300 focus:ring-2"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            ) : null}

            {phase === "exam" && streamDone && awaitingUser ? (
              <div className="flex flex-wrap justify-end gap-2">
                {EXAM_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => pickExam(opt)}
                    disabled={loading}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : null}

            {phase === "exam_other" && streamDone && awaitingUser ? (
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitOtherExam();
                }}
              >
                <input
                  value={otherExamInput}
                  onChange={(e) => setOtherExamInput(e.target.value)}
                  placeholder="Exam name"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-slate-300 focus:ring-2"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            ) : null}

            {phase === "target_rank" && streamDone && awaitingUser ? (
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitRank();
                }}
              >
                <input
                  value={rankInput}
                  onChange={(e) => setRankInput(e.target.value)}
                  placeholder="e.g. 500 or AIR 1200"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-slate-300 focus:ring-2"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            ) : null}

            {phase === "level" && streamDone && awaitingUser ? (
              <div className="flex flex-wrap justify-end gap-2">
                {LEVEL_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => pickLevel(opt)}
                    disabled={loading}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : null}

            {phase === "study_hours" && streamDone && awaitingUser ? (
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitHours();
                }}
              >
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                  placeholder="Hours per day"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-slate-300 focus:ring-2"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            ) : null}

            {phase === "weakness" && streamDone && awaitingUser ? (
              <div className="flex flex-wrap justify-end gap-2">
                {WEAKNESS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => pickWeakness(opt)}
                    disabled={loading}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : null}

            {phase === "closing" ? (
              <p className="text-center text-xs text-slate-500">
                {loading ? "Saving your training profile…" : error ? null : "Almost there…"}
              </p>
            ) : null}

            {error ? <p className="mt-2 text-center text-sm text-red-600">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
