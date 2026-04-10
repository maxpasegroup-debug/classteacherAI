"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, InlineNotice, LoadingState } from "@/components/ui-states";

type HelpRequest = {
  id: string;
  topic: string;
  subject: string | null;
  status: string;
  matchedTeacherId: string | null;
  createdAt: string;
  matchedTeacher: { id: string; name: string; email: string } | null;
};

type TeacherRow = {
  userId: string;
  subjects: string[];
  avgRating: number;
  user: { id: string; name: string; email: string };
};

export function StudentStudyHelpClient() {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [helpLoading, setHelpLoading] = useState(true);
  const [helpError, setHelpError] = useState("");

  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [createTeacherId, setCreateTeacherId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState("");

  const [matchLoadingId, setMatchLoadingId] = useState<string | null>(null);
  const [matchTeacherChoice, setMatchTeacherChoice] = useState<Record<string, string>>({});
  const [matchError, setMatchError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadHelp = useCallback(async () => {
    setHelpLoading(true);
    setHelpError("");
    try {
      const res = await fetch("/api/students/help-request");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHelpError(data.error ?? "Could not load help requests.");
        setHelpRequests([]);
        return;
      }
      setHelpRequests(data.requests ?? []);
    } catch {
      setHelpError("Network error.");
      setHelpRequests([]);
    } finally {
      setHelpLoading(false);
    }
  }, []);

  const loadTeachers = useCallback(async () => {
    setTeachersLoading(true);
    setTeachersError("");
    try {
      const res = await fetch("/api/students/teachers");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTeachersError(data.error ?? "Could not load teachers.");
        setTeachers([]);
        return;
      }
      const raw = data.teachers ?? [];
      setTeachers(
        raw.map(
          (p: { userId: string; subjects: string[]; avgRating: number; user: TeacherRow["user"] }) => ({
            userId: p.userId,
            subjects: p.subjects ?? [],
            avgRating: p.avgRating ?? 0,
            user: p.user,
          }),
        ),
      );
    } catch {
      setTeachersError("Network error.");
      setTeachers([]);
    } finally {
      setTeachersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHelp();
    void loadTeachers();
  }, [loadHelp, loadTeachers]);

  async function handleCreateHelp(e: FormEvent) {
    e.preventDefault();
    if (!topic.trim()) {
      setCreateError("Topic is required.");
      return;
    }
    setCreateLoading(true);
    setCreateError("");
    try {
      const res = await fetch("/api/students/help-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          subject: subject.trim() || undefined,
          teacherId: createTeacherId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(data.error ?? "Could not create request.");
        return;
      }
      setTopic("");
      setSubject("");
      setCreateTeacherId("");
      await loadHelp();
    } catch {
      setCreateError("Network error.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function matchTeacher(requestId: string, teacherUserId: string) {
    if (!teacherUserId) return;
    setMatchError("");
    setFeedback("");
    setMatchLoadingId(requestId);
    try {
      const res = await fetch(`/api/students/help-request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: teacherUserId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMatchError(data.error ?? "Could not match teacher.");
        return;
      }
      await loadHelp();
      setFeedback("Teacher matched.");
    } catch {
      setMatchError("Network error.");
    } finally {
      setMatchLoadingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {feedback ? <InlineNotice tone="success">{feedback}</InlineNotice> : null}
      {matchError ? <InlineNotice tone="error">{matchError}</InlineNotice> : null}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">New request</p>
        <form onSubmit={handleCreateHelp} className="mt-3 space-y-3">
          <input
            required
            placeholder="Topic *"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600"
          />
          <input
            placeholder="Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600"
          />
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Match teacher now (optional)</label>
            <select
              value={createTeacherId}
              onChange={(e) => setCreateTeacherId(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white"
            >
              <option value="">Later</option>
              {teachers.map((t) => (
                <option key={t.userId} value={t.userId}>
                  {t.user.name}
                </option>
              ))}
            </select>
          </div>
          {createError ? <p className="text-sm text-red-400">{createError}</p> : null}
          <button
            type="submit"
            disabled={createLoading || teachersLoading}
            className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            {createLoading ? "Sending…" : "Submit request"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Your requests</p>
        {teachersLoading && teachers.length === 0 ? (
          <LoadingState label="Loading teachers…" />
        ) : teachersError ? (
          <ErrorState message={teachersError} />
        ) : null}
        {helpLoading ? (
          <LoadingState label="Loading…" />
        ) : helpError ? (
          <ErrorState message={helpError} />
        ) : helpRequests.length === 0 ? (
          <EmptyState title="No requests yet" detail="Ask for help on a topic — we will match a teacher." />
        ) : (
          <ul className="mt-3 space-y-3">
            {helpRequests.map((r) => (
              <li key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm">
                <p className="font-semibold text-white">{r.topic}</p>
                {r.subject ? <p className="text-xs text-zinc-500">Subject: {r.subject}</p> : null}
                <p className="mt-1 text-xs text-zinc-500">
                  {new Date(r.createdAt).toLocaleString()} ·{" "}
                  <span className="text-zinc-300">{r.status}</span>
                </p>
                {r.status === "MATCHED" && r.matchedTeacher ? (
                  <p className="mt-2 text-xs text-zinc-400">
                    Matched: {r.matchedTeacher.name} ({r.matchedTeacher.email})
                  </p>
                ) : null}
                {r.status === "OPEN" ? (
                  <div className="mt-3 flex flex-col gap-2 border-t border-zinc-800 pt-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <label className="text-xs text-zinc-500">Match teacher</label>
                      <select
                        value={matchTeacherChoice[r.id] ?? ""}
                        onChange={(e) =>
                          setMatchTeacherChoice((prev) => ({ ...prev, [r.id]: e.target.value }))
                        }
                        className="mt-0.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white"
                      >
                        <option value="">Select…</option>
                        {teachers.map((t) => (
                          <option key={t.userId} value={t.userId}>
                            {t.user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={matchLoadingId === r.id || !matchTeacherChoice[r.id]}
                      onClick={() => void matchTeacher(r.id, matchTeacherChoice[r.id])}
                      className="rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50"
                    >
                      {matchLoadingId === r.id ? "Matching…" : "Match"}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
