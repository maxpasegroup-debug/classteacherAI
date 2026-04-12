"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { UpgradeGateModal } from "@/components/upgrade-gate-modal";
import {
  type NexaAssistantModule,
  type NexaAssistantRole,
  defaultNexaAssistantCapability,
  defaultQuickPrompts,
} from "@/lib/nexa-assistant-context";
import { isTopRankPlan } from "@/lib/plan-tier";

export type NexaAssistantProps = {
  role: NexaAssistantRole;
  module: NexaAssistantModule;
  /** Shown in nexaContext.plan (e.g. student plan or TeachX tier) */
  planLabel?: string;
  recentActivity?: string;
  quickPrompts?: { label: string; prompt: string }[];
  /** Override API capability */
  capability?: string;
  theme?: "dark" | "light";
  /** sessionStorage key for conversation id */
  storageKey: string;
  className?: string;
  /** Parent can queue a send (e.g. smart actions). Bump `injectNonce` to repeat the same text. */
  injectPrompt?: string | null;
  injectNonce?: number;
  onInjectConsumed?: () => void;
};

export function NexaAssistant({
  role,
  module,
  planLabel,
  recentActivity,
  quickPrompts: quickPromptsProp,
  capability: capabilityProp,
  theme = "light",
  storageKey,
  className = "",
  injectPrompt,
  injectNonce = 0,
  onInjectConsumed,
}: NexaAssistantProps) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [voiceHint, setVoiceHint] = useState(false);
  const [upgradeGate, setUpgradeGate] = useState<{
    open: boolean;
    message: string;
    variant: "default" | "toprank" | "teachx";
  }>({ open: false, message: "", variant: "default" });

  const conversationIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendTextRef = useRef<(text: string) => void>(() => {});
  const quickPrompts = quickPromptsProp ?? defaultQuickPrompts(role, module);
  const capability = capabilityProp ?? defaultNexaAssistantCapability(role, module);

  const isDark = theme === "dark";

  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) conversationIdRef.current = stored;
  }, [storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = (await res.json().catch(() => ({}))) as {
          profile?: { plan?: string };
          success?: boolean;
        };
        if (res.ok && data.profile?.plan) setPlan(data.profile.plan);
      } catch {
        setPlan(null);
      }
    })();
  }, [open]);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      setError("");
      setSending(true);
      setMessages((m) => [...m, { role: "user", text: trimmed }]);

      const nexaContext = {
        role,
        module,
        ...(planLabel ? { plan: planLabel } : {}),
        ...(recentActivity ? { recentActivity } : {}),
      };

      try {
        const res = await fetch("/api/nexa/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: trimmed,
            capability,
            conversationId: conversationIdRef.current ?? undefined,
            nexaContext,
          }),
        });

        const cid = res.headers.get("X-Conversation-Id");
        if (cid) {
          conversationIdRef.current = cid;
          sessionStorage.setItem(storageKey, cid);
        }

        if (!res.ok) {
          const errData = (await res.json().catch(() => ({}))) as {
            error?: string;
            message?: string;
            upgradeRequired?: boolean;
          };
          const msg = errData.message ?? errData.error ?? "Could not reach Nexa.";
          setMessages((m) => m.slice(0, -1));
          setError(msg);
          if (errData.upgradeRequired) {
            const variant =
              role === "TEACHER"
                ? "teachx"
                : plan && isTopRankPlan(plan)
                  ? "toprank"
                  : "default";
            setUpgradeGate({ open: true, message: msg, variant });
          }
          setSending(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setMessages((m) => m.slice(0, -1));
          setError("No response stream.");
          setSending(false);
          return;
        }

        const decoder = new TextDecoder();
        let accumulated = "";
        setMessages((m) => [...m, { role: "assistant", text: "" }]);

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((m) => {
            const next = [...m];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, text: accumulated };
            }
            return next;
          });
        }
      } catch {
        setMessages((m) => m.slice(0, -1));
        setError("Network error.");
      } finally {
        setSending(false);
      }
    },
    [capability, module, plan, planLabel, recentActivity, role, sending, storageKey],
  );

  sendTextRef.current = sendText;

  useEffect(() => {
    if (!injectPrompt?.trim()) return;
    setOpen(true);
    void sendTextRef.current(injectPrompt.trim());
    onInjectConsumed?.();
  }, [injectPrompt, injectNonce, onInjectConsumed]);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const t = input;
      setInput("");
      void sendText(t);
    },
    [input, sendText],
  );

  return (
    <div className={`pointer-events-none fixed bottom-0 right-0 z-[100] flex flex-col items-end p-4 sm:p-6 ${className}`}>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={`pointer-events-auto mb-3 flex max-h-[min(72vh,560px)] w-[min(100vw-2rem,420px)] flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl ${
              isDark
                ? "border-white/15 bg-zinc-900/75 text-zinc-100 shadow-black/40"
                : "border-white/60 bg-white/75 text-slate-900 shadow-slate-900/15"
            }`}
          >
            <div
              className={`flex items-center justify-between border-b px-4 py-3 ${
                isDark ? "border-white/10 bg-white/5" : "border-slate-200/80 bg-white/50"
              }`}
            >
              <div>
                <p className="text-xs font-bold tracking-wide text-transparent bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text">
                  NEXA
                </p>
                <p className={`text-[11px] ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  Central intelligence · {module}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`rounded-lg px-2 py-1 text-xs font-medium ${
                  isDark ? "text-zinc-400 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                Close
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div
                className={`flex gap-2 overflow-x-auto border-b px-3 py-2 ${isDark ? "border-white/10 bg-black/15" : "border-slate-200/80 bg-white/40"}`}
              >
                {quickPrompts.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => void sendText(q.prompt)}
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                      isDark
                        ? "border-white/15 text-cyan-200/90 hover:bg-white/10"
                        : "border-cyan-200/80 text-cyan-900 hover:bg-cyan-50"
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
              <div className={`flex-1 space-y-3 overflow-y-auto px-4 py-3 ${isDark ? "bg-black/20" : "bg-white/30"}`}>
                {messages.length === 0 ? (
                  <p className={`text-sm ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
                    Ask anything — Nexa uses your surface context to stay on-mission.
                  </p>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={`${i}-${msg.role}`}
                      className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? isDark
                            ? "ml-auto bg-cyan-600/90 text-white"
                            : "ml-auto bg-slate-900 text-white"
                          : isDark
                            ? "mr-auto border border-white/10 bg-white/5 text-zinc-100"
                            : "mr-auto border border-slate-200/80 bg-white text-slate-800"
                      }`}
                    >
                      {msg.text || (msg.role === "assistant" && sending ? "…" : "")}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {error ? (
                <p className="px-4 py-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>
              ) : null}

              <form
                onSubmit={onSubmit}
                className={`border-t p-3 ${isDark ? "border-white/10 bg-black/25" : "border-slate-200/80 bg-white/60"}`}
              >
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message Nexa…"
                    className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none ${
                      isDark
                        ? "border-white/15 bg-zinc-950/50 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-cyan-500/40"
                        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/30"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceHint((v) => !v);
                    }}
                    className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold ${
                      voiceHint
                        ? "border-violet-400 bg-violet-500/20 text-violet-200"
                        : isDark
                          ? "border-white/15 text-zinc-300 hover:bg-white/10"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    title="Voice (UI preview)"
                  >
                    Mic
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
                {voiceHint ? (
                  <p className={`mt-2 text-[11px] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
                    Voice capture is UI-only for now — type or paste your message.
                  </p>
                ) : null}
              </form>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label="Open Nexa Assistant"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-cyan-500 via-violet-600 to-fuchsia-600 text-lg font-black text-white shadow-lg shadow-violet-900/30 ring-2 ring-white/30 backdrop-blur-md"
      >
        ✦
      </motion.button>

      <UpgradeGateModal
        open={upgradeGate.open}
        variant={upgradeGate.variant}
        message={upgradeGate.message}
        onClose={() => setUpgradeGate({ open: false, message: "", variant: "default" })}
      />
    </div>
  );
}
