"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CardUI } from "@/components/card-ui";

type TeacherStudent = {
  id: string;
  name: string;
  email: string | null;
  grade: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type AttendanceRecord = {
  id: string;
  teacherStudentId: string;
  date: string;
  present: boolean;
};

type MarkEntry = {
  id: string;
  teacherStudentId: string;
  subject: string;
  title: string | null;
  score: number;
  maxScore: number;
  term: string | null;
  createdAt: string;
};

type Props = {
  initialCredits: number;
};

export function TeacherDashboardClient({ initialCredits }: Props) {
  const [credits, setCredits] = useState(initialCredits);

  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createGrade, setCreateGrade] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [attDate, setAttDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attPresent, setAttPresent] = useState(true);
  const [attSubmitLoading, setAttSubmitLoading] = useState(false);

  const [marks, setMarks] = useState<MarkEntry[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksError, setMarksError] = useState("");
  const [markSubject, setMarkSubject] = useState("");
  const [markTitle, setMarkTitle] = useState("");
  const [markScore, setMarkScore] = useState("");
  const [markMax, setMarkMax] = useState("");
  const [markTerm, setMarkTerm] = useState("");
  const [markSubmitLoading, setMarkSubmitLoading] = useState(false);

  const [aiTopic, setAiTopic] = useState("");
  const [aiSubject, setAiSubject] = useState("");
  const [aiLevel, setAiLevel] = useState("");
  const [aiKind, setAiKind] = useState<"LESSON" | "WORKSHEET" | "QUESTIONS" | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiOutput, setAiOutput] = useState("");

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedId) ?? null,
    [students, selectedId],
  );

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    setStudentsError("");
    try {
      const res = await fetch("/api/teacher/students");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStudentsError(data.error ?? "Could not load students.");
        return;
      }
      setStudents(data.students ?? []);
    } catch {
      setStudentsError("Network error loading students.");
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (students.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !students.some((s) => s.id === selectedId)) {
      setSelectedId(students[0].id);
    }
  }, [students, selectedId]);

  const loadAttendance = useCallback(async (teacherStudentId: string) => {
    setAttendanceLoading(true);
    setAttendanceError("");
    try {
      const res = await fetch(`/api/teacher/attendance?teacherStudentId=${encodeURIComponent(teacherStudentId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAttendanceError(data.error ?? "Could not load attendance.");
        setAttendanceRecords([]);
        return;
      }
      setAttendanceRecords(data.records ?? []);
    } catch {
      setAttendanceError("Network error.");
      setAttendanceRecords([]);
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  const loadMarks = useCallback(async (teacherStudentId: string) => {
    setMarksLoading(true);
    setMarksError("");
    try {
      const res = await fetch(`/api/teacher/marks?teacherStudentId=${encodeURIComponent(teacherStudentId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMarksError(data.error ?? "Could not load marks.");
        setMarks([]);
        return;
      }
      setMarks(data.marks ?? []);
    } catch {
      setMarksError("Network error.");
      setMarks([]);
    } finally {
      setMarksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setAttendanceRecords([]);
      setMarks([]);
      return;
    }
    void loadAttendance(selectedId);
    void loadMarks(selectedId);
  }, [selectedId, loadAttendance, loadMarks]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim() || undefined,
          grade: createGrade.trim() || undefined,
          notes: createNotes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(data.error ?? "Could not create student.");
        return;
      }
      setCreateName("");
      setCreateEmail("");
      setCreateGrade("");
      setCreateNotes("");
      await loadStudents();
      if (data.student?.id) setSelectedId(data.student.id);
    } catch {
      setCreateError("Network error.");
    } finally {
      setCreateLoading(false);
    }
  }

  function startEdit(s: TeacherStudent) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditEmail(s.email ?? "");
    setEditGrade(s.grade ?? "");
    setEditNotes(s.notes ?? "");
    setEditError("");
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`/api/teacher/students/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim() || null,
          grade: editGrade.trim() || null,
          notes: editNotes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(data.error ?? "Could not update.");
        return;
      }
      setEditingId(null);
      await loadStudents();
    } catch {
      setEditError("Network error.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this student and related attendance/marks?")) return;
    try {
      const res = await fetch(`/api/teacher/students/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Delete failed.");
        return;
      }
      if (selectedId === id) setSelectedId(null);
      await loadStudents();
    } catch {
      alert("Network error.");
    }
  }

  async function submitAttendance(e: FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setAttSubmitLoading(true);
    setAttendanceError("");
    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherStudentId: selectedId,
          date: attDate,
          present: attPresent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAttendanceError(data.error ?? "Could not save attendance.");
        return;
      }
      await loadAttendance(selectedId);
    } catch {
      setAttendanceError("Network error.");
    } finally {
      setAttSubmitLoading(false);
    }
  }

  async function submitMarks(e: FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    const score = Number(markScore);
    const maxScore = Number(markMax);
    if (Number.isNaN(score) || Number.isNaN(maxScore)) {
      setMarksError("Score and max score must be numbers.");
      return;
    }
    setMarkSubmitLoading(true);
    setMarksError("");
    try {
      const res = await fetch("/api/teacher/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherStudentId: selectedId,
          subject: markSubject,
          title: markTitle || undefined,
          score,
          maxScore,
          term: markTerm || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMarksError(data.error ?? "Could not save marks.");
        return;
      }
      setMarkSubject("");
      setMarkTitle("");
      setMarkScore("");
      setMarkMax("");
      setMarkTerm("");
      await loadMarks(selectedId);
    } catch {
      setMarksError("Network error.");
    } finally {
      setMarkSubmitLoading(false);
    }
  }

  async function runGenerate(kind: "LESSON" | "WORKSHEET" | "QUESTIONS") {
    if (!aiTopic.trim()) {
      setAiError("Enter a topic.");
      return;
    }
    setAiKind(kind);
    setAiLoading(true);
    setAiError("");
    setAiOutput("");
    try {
      const res = await fetch("/api/teacher/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          topic: aiTopic.trim(),
          subject: aiSubject || undefined,
          level: aiLevel || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAiError(data.error ?? "Generation failed.");
        return;
      }
      setAiOutput(data.content ?? "");
      void fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => {
          const bal = d.user?.credits ?? 0;
          if (bal != null) setCredits(bal);
        })
        .catch(() => undefined);
    } catch {
      setAiError("Network error.");
    } finally {
      setAiLoading(false);
    }
  }

  const totalMarkEntries = marks.length;
  const presentCount = attendanceRecords.filter((r) => r.present).length;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <CardUI title="Students" description="Roster you manage in this dashboard.">
            <p className="text-2xl font-semibold text-slate-900">{studentsLoading ? "…" : students.length}</p>
          </CardUI>
          <CardUI title="Credits" description="Used for AI lesson, worksheet, and question generation.">
            <p className="text-2xl font-semibold text-slate-900">{credits}</p>
          </CardUI>
          <CardUI title="Selected student" description={selectedStudent ? selectedStudent.name : "Pick a student below."}>
            <p className="text-sm text-slate-600">
              {selectedStudent
                ? `${attendanceRecords.length} attendance · ${totalMarkEntries} mark entries`
                : "—"}
            </p>
          </CardUI>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Student management</h2>
        <CardUI title="Add student" description="Creates a roster entry for your class (not a platform login).">
          <form onSubmit={handleCreate} className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                required
                placeholder="Name *"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="Grade / class (optional)"
                value={createGrade}
                onChange={(e) => setCreateGrade(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="Notes (optional)"
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            {createError ? <p className="text-sm text-red-600">{createError}</p> : null}
            <button
              type="submit"
              disabled={createLoading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {createLoading ? "Saving…" : "Add student"}
            </button>
          </form>
        </CardUI>

        <CardUI title="Your students" description="Select one to manage attendance and marks.">
          {studentsLoading ? (
            <p className="text-sm text-slate-500">Loading students…</p>
          ) : studentsError ? (
            <p className="text-sm text-red-600">{studentsError}</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-500">No students yet. Add one above.</p>
          ) : (
            <ul className="space-y-2">
              {students.map((s) => (
                <li key={s.id}>
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
                      selectedId === s.id ? "border-blue-400 bg-blue-50/50" : "border-slate-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className="min-w-0 flex-1 text-left font-medium text-slate-900"
                    >
                      {s.name}
                      {s.grade ? <span className="ml-2 text-xs font-normal text-slate-500">({s.grade})</span> : null}
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(s.id)}
                        className="rounded-lg border border-red-100 px-2 py-1 text-xs text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {editingId === s.id ? (
                    <form onSubmit={saveEdit} className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <input
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                      <input
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="Email"
                      />
                      <input
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={editGrade}
                        onChange={(e) => setEditGrade(e.target.value)}
                        placeholder="Grade"
                      />
                      <input
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Notes"
                      />
                      {editError ? <p className="text-xs text-red-600">{editError}</p> : null}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={editLoading}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white"
                        >
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="text-xs text-slate-600">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardUI>
      </section>

      {selectedId && selectedStudent ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Attendance & marks — <span className="text-slate-600">{selectedStudent.name}</span>
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <CardUI title="Mark attendance" description="One record per student per calendar day (UTC).">
              <form onSubmit={submitAttendance} className="space-y-2">
                <input
                  type="date"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={attPresent} onChange={(e) => setAttPresent(e.target.checked)} />
                  Present
                </label>
                {attendanceError ? <p className="text-xs text-red-600">{attendanceError}</p> : null}
                <button
                  type="submit"
                  disabled={attSubmitLoading}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                  {attSubmitLoading ? "Saving…" : "Save attendance"}
                </button>
              </form>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-medium text-slate-500">History ({presentCount} present / {attendanceRecords.length} rows)</p>
                {attendanceLoading ? (
                  <p className="text-sm text-slate-500">Loading…</p>
                ) : attendanceRecords.length === 0 ? (
                  <p className="text-sm text-slate-500">No records yet.</p>
                ) : (
                  <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-slate-700">
                    {attendanceRecords.map((r) => (
                      <li key={r.id} className="flex justify-between rounded bg-slate-50 px-2 py-1">
                        <span>{new Date(r.date).toLocaleDateString()}</span>
                        <span>{r.present ? "Present" : "Absent"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardUI>

            <CardUI title="Marks" description="Add scores; history loads below the form.">
              <form onSubmit={submitMarks} className="space-y-2">
                <input
                  required
                  placeholder="Subject *"
                  value={markSubject}
                  onChange={(e) => setMarkSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  placeholder="Title (optional)"
                  value={markTitle}
                  onChange={(e) => setMarkTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    required
                    type="number"
                    step="any"
                    placeholder="Score *"
                    value={markScore}
                    onChange={(e) => setMarkScore(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    required
                    type="number"
                    step="any"
                    placeholder="Max *"
                    value={markMax}
                    onChange={(e) => setMarkMax(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <input
                  placeholder="Term (optional)"
                  value={markTerm}
                  onChange={(e) => setMarkTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                {marksError ? <p className="text-xs text-red-600">{marksError}</p> : null}
                <button
                  type="submit"
                  disabled={markSubmitLoading}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                  {markSubmitLoading ? "Saving…" : "Add mark"}
                </button>
              </form>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-medium text-slate-500">Recent marks</p>
                {marksLoading ? (
                  <p className="text-sm text-slate-500">Loading…</p>
                ) : marks.length === 0 ? (
                  <p className="text-sm text-slate-500">No marks yet.</p>
                ) : (
                  <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-slate-700">
                    {marks.map((m) => (
                      <li key={m.id} className="rounded bg-slate-50 px-2 py-1">
                        <span className="font-medium">{m.subject}</span> · {m.score}/{m.maxScore}
                        {m.title ? <span className="text-slate-500"> — {m.title}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardUI>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">AI tools (Nexa)</h2>
        <CardUI
          title="Lesson plan, worksheet, questions"
          description="Uses your subscription and credits. Ensure plan and credits allow AI in Settings / Pricing."
        >
          <div className="space-y-3">
            <input
              placeholder="Topic *"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                placeholder="Subject (optional)"
                value={aiSubject}
                onChange={(e) => setAiSubject(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="Level (optional)"
                value={aiLevel}
                onChange={(e) => setAiLevel(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => void runGenerate("LESSON")}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {aiLoading && aiKind === "LESSON" ? "Generating…" : "Lesson plan"}
              </button>
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => void runGenerate("WORKSHEET")}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 disabled:opacity-50"
              >
                {aiLoading && aiKind === "WORKSHEET" ? "Generating…" : "Worksheet"}
              </button>
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => void runGenerate("QUESTIONS")}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 disabled:opacity-50"
              >
                {aiLoading && aiKind === "QUESTIONS" ? "Generating…" : "Questions"}
              </button>
            </div>
            {aiError ? <p className="text-sm text-red-600">{aiError}</p> : null}
            {aiOutput ? (
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-800">{aiOutput}</pre>
            ) : null}
          </div>
        </CardUI>
      </section>
    </div>
  );
}
