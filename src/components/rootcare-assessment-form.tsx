"use client";

import { FormEvent, useState } from "react";
import { InlineNotice } from "@/components/ui-states";

const QUESTIONS: { id: string; label: string }[] = [
  { id: "q1", label: "I enjoy analytical or technical problems" },
  { id: "q2", label: "I like leading or presenting ideas to others" },
  { id: "q3", label: "I prefer structured routines over open-ended days" },
  { id: "q4", label: "I learn well from hands-on practice" },
  { id: "q5", label: "I am curious about how industries and careers evolve" },
];

export function RootcareAssessmentForm() {
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    const o: Record<string, number> = {};
    for (const q of QUESTIONS) o[q.id] = 3;
    return o;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");
    try {
      const res = await fetch("/api/rootcare/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save assessment.");
        return;
      }
      setOk(`Saved. Your snapshot score: ${typeof data.score === "number" ? data.score.toFixed(0) : "—"}.`);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {QUESTIONS.map((q) => (
        <label key={q.id} className="block text-sm text-slate-700">
          <span className="mb-1 block">{q.label}</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={answers[q.id] ?? 3}
            onChange={(e) =>
              setAnswers((prev) => ({
                ...prev,
                [q.id]: Number.parseInt(e.target.value, 10),
              }))
            }
            className="w-full accent-teal-700"
          />
          <span className="text-xs text-slate-500">{answers[q.id] ?? 3} / 5</span>
        </label>
      ))}
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      {ok ? <InlineNotice tone="success">{ok}</InlineNotice> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Saving…" : "Submit basic assessment"}
      </button>
    </form>
  );
}
