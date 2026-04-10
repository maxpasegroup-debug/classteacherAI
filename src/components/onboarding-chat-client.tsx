"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type StepDef = {
  key: "name" | "exam" | "targetRank" | "level" | "studyHours" | "weakness";
  prompt: string;
  options?: string[];
  placeholder?: string;
  numeric?: boolean;
};

const STEPS: StepDef[] = [
  { key: "name", prompt: "First, confirm your name.", placeholder: "Your name" },
  { key: "exam", prompt: "Which exam are you training for?", options: ["NEET", "JEE", "UPSC", "CAT"], placeholder: "Type exam" },
  { key: "targetRank", prompt: "What is your target rank?", placeholder: "e.g. 100", numeric: true },
  { key: "level", prompt: "Your current level?", options: ["Beginner", "Average", "Advanced"] },
  { key: "studyHours", prompt: "How many focused hours can you study daily?", placeholder: "e.g. 5", numeric: true },
  { key: "weakness", prompt: "What is your biggest weakness right now?", options: ["Focus", "Speed", "Memory", "Accuracy"], placeholder: "Type weakness" },
];

type Answers = {
  name: string;
  exam: string;
  targetRank: string;
  level: string;
  studyHours: string;
  weakness: string;
};

const initialAnswers: Answers = {
  name: "",
  exam: "",
  targetRank: "",
  level: "",
  studyHours: "",
  weakness: "",
};

export function OnboardingChatClient({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ ...initialAnswers, name: defaultName });
  const [input, setInput] = useState(defaultName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const current = STEPS[step];
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const chat = useMemo(() => {
    const rows: Array<{ from: "ai" | "user"; text: string }> = [
      { from: "ai", text: "Hi, I am Nexa. I will train you to become a top ranker." },
    ];
    for (let i = 0; i <= step; i += 1) {
      const s = STEPS[i];
      rows.push({ from: "ai", text: s.prompt });
      const value = answers[s.key];
      if (value && (i < step || !current)) {
        rows.push({ from: "user", text: value });
      }
    }
    return rows;
  }, [answers, step, current]);

  function advance(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setError("");
    setAnswers((prev) => ({ ...prev, [current.key]: trimmed }));
    if (step === STEPS.length - 1) {
      void submit({ ...answers, [current.key]: trimmed });
      return;
    }
    const nextStep = step + 1;
    setStep(nextStep);
    setInput(answers[STEPS[nextStep].key] ?? "");
  }

  async function submit(payload: Answers) {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam: payload.exam,
          targetRank: Number(payload.targetRank),
          level: payload.level,
          studyHours: Number(payload.studyHours),
          weakness: payload.weakness,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save onboarding details.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50 px-4 py-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Step {Math.min(step + 1, STEPS.length)} / {STEPS.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          {chat.map((m, idx) => (
            <div key={`${m.from}-${idx}`} className={`flex ${m.from === "ai" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.from === "ai"
                    ? "bg-slate-100 text-slate-800"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          <div className="animate-pulse text-xs text-slate-400">Nexa is typing...</div>

          {current?.options ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {current.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => advance(option)}
                  disabled={loading}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!current) return;
              if (current.numeric && Number.isNaN(Number(input))) {
                setError("Please enter a valid number.");
                return;
              }
              advance(input);
            }}
            className="flex flex-col gap-2 pt-2 sm:flex-row"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={current?.placeholder ?? "Type your answer"}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Building profile..." : step === STEPS.length - 1 ? "Finish" : "Next"}
            </button>
          </form>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {step === STEPS.length - 1 && !loading ? (
            <p className="text-xs text-emerald-700">Your training system is ready.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
