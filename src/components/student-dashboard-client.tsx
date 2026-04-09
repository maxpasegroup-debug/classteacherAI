"use client";

import Link from "next/link";
import type { SubscriptionPlan } from "@prisma/client";
import { RootCareFunnelNudge } from "@/components/rootcare-funnel-nudge";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CardUI } from "@/components/card-ui";
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

type Course = {
  id: string;
  title: string;
  category: string;
  description: string;
  lessons: { id: string }[];
};

type ProgressRow = {
  courseId: string;
  progressPct: number;
  course: Course;
};

type DashboardProps = {
  plan: SubscriptionPlan;
};

export function StudentDashboardClient({ plan }: DashboardProps) {
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

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");

  const [progressRows, setProgressRows] = useState<ProgressRow[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState("");

  const [progressDraft, setProgressDraft] = useState<Record<string, number>>({});
  const [saveLoadingId, setSaveLoadingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

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
      const normalized: TeacherRow[] = raw.map(
        (p: { userId: string; subjects: string[]; avgRating: number; user: TeacherRow["user"] }) => ({
          userId: p.userId,
          subjects: p.subjects ?? [],
          avgRating: p.avgRating ?? 0,
          user: p.user,
        }),
      );
      setTeachers(normalized);
    } catch {
      setTeachersError("Network error.");
      setTeachers([]);
    } finally {
      setTeachersLoading(false);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCoursesError("");
    try {
      const res = await fetch("/api/skills/courses");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCoursesError(data.error ?? "Could not load courses.");
        setCourses([]);
        return;
      }
      setCourses(data.courses ?? []);
    } catch {
      setCoursesError("Network error.");
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  const loadProgress = useCallback(async () => {
    setProgressLoading(true);
    setProgressError("");
    try {
      const res = await fetch("/api/skills/progress");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProgressError(data.error ?? "Could not load progress.");
        setProgressRows([]);
        return;
      }
      setProgressRows(data.progress ?? []);
    } catch {
      setProgressError("Network error.");
      setProgressRows([]);
    } finally {
      setProgressLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHelp();
    void loadTeachers();
    void loadCourses();
  }, [loadHelp, loadTeachers, loadCourses]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    const saved = new Map<string, number>();
    for (const r of progressRows) {
      saved.set(r.courseId, r.progressPct);
    }
    setProgressDraft((prev) => {
      const next = { ...prev };
      for (const c of courses) {
        const pct = saved.get(c.id);
        if (pct !== undefined) {
          next[c.id] = pct;
        } else if (next[c.id] === undefined) {
          next[c.id] = 0;
        }
      }
      return next;
    });
  }, [courses, progressRows]);

  const progressByCourseId = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of progressRows) {
      m.set(r.courseId, r.progressPct);
    }
    return m;
  }, [progressRows]);

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
      setFeedback("Teacher matched successfully.");
    } catch {
      setMatchError("Network error.");
    } finally {
      setMatchLoadingId(null);
    }
  }

  async function saveProgress(courseId: string) {
    const pct = progressDraft[courseId];
    if (pct === undefined || Number.isNaN(pct) || pct < 0 || pct > 100) {
      setSaveError("Progress must be between 0 and 100.");
      return;
    }
    setSaveLoadingId(courseId);
    setSaveError("");
    try {
      const res = await fetch("/api/skills/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, progressPct: pct }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error ?? "Could not save progress.");
        return;
      }
      await loadProgress();
    } catch {
      setSaveError("Network error.");
    } finally {
      setSaveLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Quick links</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CardUI title="Nexa AI" description="Ask questions and get explanations.">
            <Link
              href="/nexa"
              className="inline-block rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 px-3 py-2 text-sm font-semibold text-white"
            >
              Open Nexa AI
            </Link>
          </CardUI>
          <CardUI title="Exams & ranks" description="Practice, advanced modes, TOP10 camp, and achiever leaderboard.">
            <Link
              href="/student/exams"
              className="inline-block rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            >
              Open exam engine
            </Link>
          </CardUI>
          <CardUI title="Performance" description="Accuracy, weak topics, growth insights.">
            <Link
              href="/student/performance"
              className="inline-block rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900"
            >
              View growth
            </Link>
          </CardUI>
          <CardUI title="RootCare" description="Career direction — free assessment & mapping; more on Pro.">
            <Link
              href="/rootcare"
              className="inline-block rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900"
            >
              Open RootCare
            </Link>
          </CardUI>
          <CardUI title="Skill tracks" description="Course catalog, lessons, and certificates.">
            <Link
              href="/skills"
              className="inline-block rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800"
            >
              Browse skills
            </Link>
          </CardUI>
          {plan === "TOP10" ? (
            <CardUI title="TOP10 training lab" description="Elite training loop, AI trainer context, and daily challenges.">
              <Link
                href="/student/top10"
                className="inline-block rounded-xl border-2 border-violet-300 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-900"
              >
                Open training lab
              </Link>
            </CardUI>
          ) : null}
        </div>
      </section>

      <RootCareFunnelNudge variant="dashboard" />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Study help</h2>
        {feedback ? <InlineNotice tone="success">{feedback}</InlineNotice> : null}
        {matchError ? <InlineNotice tone="error">{matchError}</InlineNotice> : null}
        <CardUI title="New request" description="Request help on a topic. Optionally pick a teacher now or match later.">
          <form onSubmit={handleCreateHelp} className="space-y-2">
            <input
              required
              placeholder="Topic *"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div>
              <label className="mb-1 block text-xs text-slate-500">Match teacher now (optional)</label>
              <select
                value={createTeacherId}
                onChange={(e) => setCreateTeacherId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">— Later —</option>
                {teachers.map((t) => (
                  <option key={t.userId} value={t.userId}>
                    {t.user.name} ({t.subjects.slice(0, 2).join(", ") || "General"})
                  </option>
                ))}
              </select>
            </div>
            {createError ? <p className="text-sm text-red-600">{createError}</p> : null}
            <button
              type="submit"
              disabled={createLoading || teachersLoading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {createLoading ? "Submitting…" : "Submit request"}
            </button>
          </form>
        </CardUI>

        <CardUI title="Your requests" description="OPEN = awaiting teacher; MATCHED = teacher assigned.">
          {teachersLoading && teachers.length === 0 ? (
            <LoadingState label="Loading teachers…" />
          ) : teachersError ? (
            <ErrorState message={teachersError} />
          ) : null}
          {helpLoading ? (
            <LoadingState label="Loading requests…" />
          ) : helpError ? (
            <ErrorState message={helpError} />
          ) : helpRequests.length === 0 ? (
            <EmptyState title="No help requests yet" detail="Create your first request and get matched with a teacher." />
          ) : (
            <ul className="space-y-3">
              {helpRequests.map((r) => (
                <li key={r.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{r.topic}</p>
                      {r.subject ? <p className="text-xs text-slate-500">Subject: {r.subject}</p> : null}
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleString()} · Status:{" "}
                        <span className="font-medium text-slate-800">{r.status}</span>
                      </p>
                    </div>
                  </div>
                  {r.status === "MATCHED" && r.matchedTeacher ? (
                    <p className="mt-2 text-xs text-slate-700">
                      Matched: <span className="font-medium">{r.matchedTeacher.name}</span> ({r.matchedTeacher.email})
                    </p>
                  ) : null}
                  {r.status === "OPEN" ? (
                    <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-50 pt-2">
                      <div className="min-w-[180px] flex-1">
                        <label className="text-xs text-slate-500">Match a teacher</label>
                        <select
                          value={matchTeacherChoice[r.id] ?? ""}
                          onChange={(e) =>
                            setMatchTeacherChoice((prev) => ({ ...prev, [r.id]: e.target.value }))
                          }
                          className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
                        >
                          <option value="">Select teacher…</option>
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
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      >
                        {matchLoadingId === r.id ? "Matching…" : "Match"}
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardUI>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
        <CardUI title="Courses & progress" description="Courses from the catalog; save your progress percentage (0–100).">
          {coursesLoading || progressLoading ? (
            <LoadingState label="Loading courses…" />
          ) : coursesError || progressError ? (
            <ErrorState message={coursesError || progressError} />
          ) : courses.length === 0 ? (
            <EmptyState title="No courses in the catalog yet" detail="Check back soon for curated skill tracks." />
          ) : (
            <ul className="space-y-4">
              {courses.map((c) => {
                const pct = progressByCourseId.get(c.id) ?? progressDraft[c.id] ?? 0;
                const draft = progressDraft[c.id] ?? pct;
                return (
                  <li key={c.id} className="rounded-xl border border-slate-100 p-3">
                    <p className="font-semibold text-slate-900">{c.title}</p>
                    <p className="text-xs text-slate-500">{c.category}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{c.description}</p>
                    <p className="mt-1 text-xs text-slate-400">{c.lessons.length} lessons</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        Progress %
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={draft}
                          onChange={(e) =>
                            setProgressDraft((prev) => ({
                              ...prev,
                              [c.id]: Number(e.target.value),
                            }))
                          }
                          className="w-20 rounded border border-slate-200 px-2 py-1 text-sm"
                        />
                      </label>
                      <div className="h-2 min-w-[120px] flex-1 max-w-xs overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-[width]"
                          style={{ width: `${Math.min(100, Math.max(0, draft))}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={saveLoadingId === c.id}
                        onClick={() => void saveProgress(c.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800"
                      >
                        {saveLoadingId === c.id ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {saveError ? <p className="mt-2 text-sm text-red-600">{saveError}</p> : null}
        </CardUI>
      </section>
    </div>
  );
}
