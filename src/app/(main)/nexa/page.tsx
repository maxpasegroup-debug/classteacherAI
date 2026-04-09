"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Mode = "TEACHER" | "STUDENT";
type Capability =
  | "LESSON_PLANNING"
  | "DOUBT_SOLVING"
  | "NOTES_GENERATION"
  | "CONCEPT_TEACHING"
  | "EXAM_TIPS"
  | "CONTENT_CREATION";

type Message = { id: string; role: "USER" | "ASSISTANT"; content: string };
type Conversation = {
  id: string;
  title: string;
  mode: Mode;
  capability: Capability;
  messages: Message[];
};

const STUDENT_CAPABILITIES: { id: Capability; label: string; hint: string }[] = [
  { id: "DOUBT_SOLVING", label: "Doubt solving", hint: "Step-by-step help on specific questions" },
  { id: "CONCEPT_TEACHING", label: "Concept teaching", hint: "Learn a topic from the ground up" },
  { id: "EXAM_TIPS", label: "Exam tips", hint: "Revision, timing, and test strategy" },
  { id: "NOTES_GENERATION", label: "Notes & summaries", hint: "Structured notes and flashcards" },
];

const TEACHER_CAPABILITIES: { id: Capability; label: string; hint: string }[] = [
  { id: "LESSON_PLANNING", label: "Lesson planning", hint: "Objectives, flow, and assessment" },
  { id: "CONTENT_CREATION", label: "Content creation", hint: "Worksheets, items, rubrics, handouts" },
  { id: "NOTES_GENERATION", label: "Notes & comms", hint: "Teacher guides, emails, outlines" },
];

type SpeechRecognitionInstance = {
  start: () => void;
  stop: () => void;
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechWindow = Window & {
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  SpeechRecognition?: new () => SpeechRecognitionInstance;
};

function capsForMode(mode: Mode) {
  return mode === "TEACHER" ? TEACHER_CAPABILITIES : STUDENT_CAPABILITIES;
}

function normalizeCapability(mode: Mode, cap: Capability): Capability {
  const allowed = capsForMode(mode).map((c) => c.id);
  if (allowed.includes(cap)) return cap;
  return mode === "TEACHER" ? "LESSON_PLANNING" : "DOUBT_SOLVING";
}

export default function NexaPage() {
  const [roles, setRoles] = useState<("TEACHER" | "STUDENT")[]>([]);
  const [activeRole, setActiveRole] = useState<Mode>("STUDENT");
  const [hasAnyConversation, setHasAnyConversation] = useState(false);
  const appliedDefaultMode = useRef(false);
  const [mode, setMode] = useState<Mode>("STUDENT");
  const [capability, setCapability] = useState<Capability>("DOUBT_SOLVING");
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [nexaPersona, setNexaPersona] = useState<"top10_trainer" | "pro" | "basic" | null>(null);
  const [trainerMemory, setTrainerMemory] = useState<{
    rankReadiness: number;
    weakTopics: string[];
    examCount: number;
    lastAccuracyPct: number | null;
    lastExamAt: string | null;
  } | null>(null);

  const [studentSubject, setStudentSubject] = useState("");
  const [studentLevel, setStudentLevel] = useState("");
  const [teacherSubject, setTeacherSubject] = useState("");
  const [prefsDirty, setPrefsDirty] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const canUseTeacher = roles.includes("TEACHER");
  const canUseStudent = roles.includes("STUDENT");

  const loadPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/nexa/preferences");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const bal =
        typeof data.aiCredits === "number"
          ? data.aiCredits
          : typeof data.credits === "number"
            ? data.credits
            : null;
      setCredits(bal);
      if (typeof data.plan === "string") setPlan(data.plan);
      if (data.nexaPersona === "top10_trainer" || data.nexaPersona === "pro" || data.nexaPersona === "basic") {
        setNexaPersona(data.nexaPersona);
      }
      if (data.trainerMemory && typeof data.trainerMemory === "object") {
        setTrainerMemory({
          rankReadiness: typeof data.trainerMemory.rankReadiness === "number" ? data.trainerMemory.rankReadiness : 0,
          weakTopics: Array.isArray(data.trainerMemory.weakTopics) ? data.trainerMemory.weakTopics : [],
          examCount: typeof data.trainerMemory.examCount === "number" ? data.trainerMemory.examCount : 0,
          lastAccuracyPct:
            typeof data.trainerMemory.lastAccuracyPct === "number" ? data.trainerMemory.lastAccuracyPct : null,
          lastExamAt: typeof data.trainerMemory.lastExamAt === "string" ? data.trainerMemory.lastExamAt : null,
        });
      } else {
        setTrainerMemory(null);
      }
      if (typeof data.nexaStudentSubject === "string") setStudentSubject(data.nexaStudentSubject ?? "");
      if (typeof data.nexaStudentLevel === "string") setStudentLevel(data.nexaStudentLevel ?? "");
      if (typeof data.nexaTeacherSubject === "string") setTeacherSubject(data.nexaTeacherSubject ?? "");
      setPrefsDirty(false);
    } catch {
      /* ignore */
    }
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.user) return;
      const r = data.user.roles as ("TEACHER" | "STUDENT")[];
      setRoles(r);
      const ar = data.user.activeRole as Mode;
      setActiveRole(ar);
      setPlan(typeof data.user.plan === "string" ? data.user.plan : null);
      const bal =
        typeof data.user.aiCredits === "number"
          ? data.user.aiCredits
          : typeof data.user.credits === "number"
            ? data.user.credits
            : null;
      setCredits(bal);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadMe();
    void loadPreferences();
  }, [loadMe, loadPreferences]);

  useEffect(() => {
    if (appliedDefaultMode.current) return;
    if (hasAnyConversation) return;
    if (roles.length === 0) return;
    appliedDefaultMode.current = true;
    setMode(activeRole);
    setCapability(normalizeCapability(activeRole, "DOUBT_SOLVING"));
  }, [roles, activeRole, hasAnyConversation]);

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    let cancelled = false;
    async function loadSug() {
      try {
        const res = await fetch(
          `/api/nexa/suggestions?mode=${encodeURIComponent(mode)}&capability=${encodeURIComponent(capability)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setSuggestions(data.suggestions ?? []);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }
    void loadSug();
    return () => {
      cancelled = true;
    };
  }, [mode, capability]);

  async function loadConversations() {
    try {
      const res = await fetch("/api/nexa/conversations");
      if (!res.ok) return;
      const data = await res.json();
      const loaded = (data.conversations ?? []) as Conversation[];
      setConversations(loaded);
      setHasAnyConversation(loaded.length > 0);
      if (loaded[0]) {
        setConversationId(loaded[0].id);
        setMessages(loaded[0].messages ?? []);
        const m = loaded[0].mode === "TEACHER" ? "TEACHER" : "STUDENT";
        setMode(m);
        setCapability(normalizeCapability(m, loaded[0].capability as Capability));
      }
    } catch {
      setError("Could not load chat history.");
    }
  }

  async function savePreferences() {
    try {
      const res = await fetch("/api/nexa/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nexaStudentSubject: studentSubject || null,
          nexaStudentLevel: studentLevel || null,
          nexaTeacherSubject: teacherSubject || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const bal =
          typeof data.aiCredits === "number"
            ? data.aiCredits
            : typeof data.credits === "number"
              ? data.credits
              : null;
        if (bal !== null) setCredits(bal);
      }
      setPrefsDirty(false);
    } catch {
      setError("Could not save Nexa context.");
    }
  }

  function newChat() {
    setConversationId(null);
    setMessages([]);
    setError("");
  }

  function activateConversation(id: string) {
    const selected = conversations.find((item) => item.id === id);
    if (!selected) return;
    setConversationId(selected.id);
    setMessages(selected.messages);
    const m = selected.mode === "TEACHER" ? "TEACHER" : "STUDENT";
    setMode(m);
    setCapability(normalizeCapability(m, selected.capability as Capability));
    setError("");
  }

  function startVoiceInput() {
    const voiceWindow = window as SpeechWindow;
    const SpeechCtor = voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;
    if (!SpeechCtor) {
      setError("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new SpeechCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  const subjectPayload = useMemo(() => {
    return mode === "STUDENT" ? studentSubject.trim() : teacherSubject.trim();
  }, [mode, studentSubject, teacherSubject]);

  const levelPayload = useMemo(() => studentLevel.trim(), [studentLevel]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    const basicStudent = plan === "BASIC" && mode === "STUDENT";
    const basicTeacher = plan === "BASIC" && mode === "TEACHER";
    const proOut = plan === "PRO" && credits !== null && credits <= 0;
    if (basicTeacher) {
      setError("Nexa AI is not available for teachers on Basic. Upgrade to Pro or TOP10.");
      return;
    }
    if (basicStudent) {
      setError("Nexa AI is not available on Basic. Upgrade to Pro or TOP10.");
      return;
    }
    if (proOut) {
      setError("You have no AI credits. Buy credits or upgrade your plan to use Nexa AI.");
      return;
    }

    setSending(true);
    setError("");
    setInput("");

    const userMessage: Message = {
      id: `local-user-${Date.now()}`,
      role: "USER",
      content,
    };
    const assistantMessageId = `local-assistant-${Date.now()}`;
    setMessages((prev) => [...prev, userMessage, { id: assistantMessageId, role: "ASSISTANT", content: "" }]);

    try {
      const response = await fetch("/api/nexa/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content,
          mode,
          capability,
          subject: subjectPayload || undefined,
          level: mode === "STUDENT" ? levelPayload || undefined : undefined,
        }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Unable to get AI response.");
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId && msg.id !== userMessage.id));
        if (response.status === 402) {
          setCredits(0);
        }
        return;
      }

      const returnedConversationId = response.headers.get("X-Conversation-Id");
      if (returnedConversationId) {
        setConversationId(returnedConversationId);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: accumulated } : msg)),
        );
      }

      await loadConversations();
      await loadPreferences();
    } catch {
      setError("Network error while streaming response.");
    } finally {
      setSending(false);
      setListening(false);
    }
  }

  const capList = capsForMode(mode);

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">Nexa AI</p>
            <p className="text-xs text-slate-500">
              {nexaPersona === "top10_trainer" && mode === "STUDENT"
                ? "TOP10 AI Trainer — strict, goal-oriented; uses your exam memory for coaching."
                : "Context-aware assistant — mode follows your role; save subject & level for better answers."}
            </p>
            {nexaPersona === "top10_trainer" && mode === "STUDENT" && trainerMemory ? (
              <p className="mt-1 text-xs text-violet-900">
                Rank readiness {trainerMemory.rankReadiness}/100
                {trainerMemory.weakTopics.length > 0
                  ? ` · You need improvement in: ${trainerMemory.weakTopics.slice(0, 4).join(", ")}`
                  : ""}
                {trainerMemory.examCount > 0 ? ` · Exams tracked: ${trainerMemory.examCount}` : ""}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {plan === "TOP10" && mode === "STUDENT" ? (
              <span className="rounded-lg bg-violet-900 px-2.5 py-1 text-xs font-semibold text-violet-100">
                TOP10 AI Trainer
              </span>
            ) : null}
            {plan === "BASIC" && mode === "STUDENT" ? (
              <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900">
                Basic: Nexa AI requires Pro or TOP10
              </span>
            ) : credits !== null ? (
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                  credits <= 0 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"
                }`}
              >
                AI credits: {credits.toLocaleString()}
              </span>
            ) : null}
            <button
              type="button"
              onClick={newChat}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600"
            >
              New chat
            </button>
          </div>
        </div>

        <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium text-slate-700">Context (saved to your account)</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {mode === "STUDENT" ? (
              <>
                <label className="block text-xs text-slate-500">
                  Subject
                  <input
                    value={studentSubject}
                    onChange={(e) => {
                      setStudentSubject(e.target.value);
                      setPrefsDirty(true);
                    }}
                    placeholder="e.g. Mathematics, Science"
                    className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block text-xs text-slate-500">
                  Level / grade
                  <input
                    value={studentLevel}
                    onChange={(e) => {
                      setStudentLevel(e.target.value);
                      setPrefsDirty(true);
                    }}
                    placeholder="e.g. Class 10, Grade 9"
                    className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                  />
                </label>
              </>
            ) : (
              <label className="block text-xs text-slate-500 sm:col-span-2">
                Primary teaching subject
                <input
                  value={teacherSubject}
                  onChange={(e) => {
                    setTeacherSubject(e.target.value);
                    setPrefsDirty(true);
                  }}
                  placeholder="e.g. English, Physics"
                  className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                />
              </label>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void savePreferences()}
              disabled={!prefsDirty}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
            >
              Save context
            </button>
            {activeRole ? (
              <span className="text-xs text-slate-500">Dashboard role: {activeRole}</span>
            ) : null}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {canUseTeacher ? (
            <button
              type="button"
              onClick={() => {
                setMode("TEACHER");
                setCapability("LESSON_PLANNING");
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
                mode === "TEACHER" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Teacher mode
            </button>
          ) : null}
          {canUseStudent ? (
            <button
              type="button"
              onClick={() => {
                setMode("STUDENT");
                setCapability("DOUBT_SOLVING");
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
                mode === "STUDENT" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Student mode
            </button>
          ) : null}
          {!canUseTeacher && !canUseStudent ? (
            <p className="text-xs text-amber-700">No student/teacher role on this account.</p>
          ) : null}
        </div>

        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {capList.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.hint}
              onClick={() => setCapability(item.id)}
              className={`rounded-xl border px-3 py-2 text-left text-xs ${
                capability === item.id ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600"
              }`}
            >
              <span className="font-semibold">{item.label}</span>
              <span className="mt-0.5 block text-[11px] text-slate-500">{item.hint}</span>
            </button>
          ))}
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {conversations.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => activateConversation(item.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs ${
                conversationId === item.id ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {item.title || "Untitled"}
            </button>
          ))}
        </div>

        {suggestions.length > 0 ? (
          <div className="mb-3">
            <p className="mb-1 text-xs font-medium text-slate-600">Suggestions</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="h-[48vh] space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500">
              {mode === "STUDENT"
                ? "Ask a doubt, learn a concept, or get exam tips — Nexa remembers this thread."
                : "Plan lessons or create classroom content — Nexa remembers this thread."}
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === "USER" ? "ml-auto bg-slate-900 text-white" : "bg-white text-slate-700"
                }`}
              >
                {msg.content || (msg.role === "ASSISTANT" && sending ? "Thinking..." : "")}
              </div>
            ))
          )}
          <div ref={messageEndRef} />
        </div>

        <form onSubmit={sendMessage} className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={startVoiceInput}
            className={`rounded-xl px-3 py-2 text-xs font-medium ${
              listening ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {listening ? "Listening..." : "Voice"}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Nexa AI..."
            className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={
              sending ||
              (plan === "BASIC" && mode === "TEACHER") ||
              (plan === "BASIC" && mode === "STUDENT") ||
              (plan === "PRO" && credits !== null && credits <= 0)
            }
            className="rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {plan === "BASIC" && mode === "STUDENT"
              ? "Upgrade for AI"
              : plan === "PRO"
                ? "Send (uses AI credits)"
                : "Send"}
          </button>
        </form>
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        {plan === "PRO" && credits === 0 ? (
          <p className="mt-2 text-xs text-amber-800">
            You are out of AI credits. Top up or upgrade.{" "}
            <Link href="/credits" className="font-medium text-blue-700 underline">
              Buy credits
            </Link>{" "}
            or{" "}
            <Link href="/pricing" className="font-medium text-blue-700 underline">
              view plans
            </Link>
            .
          </p>
        ) : null}
      </div>
    </section>
  );
}
