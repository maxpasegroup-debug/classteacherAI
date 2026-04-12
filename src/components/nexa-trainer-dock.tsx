"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { UpgradeGateModal } from "@/components/upgrade-gate-modal";
import { isTopRankPlan } from "@/lib/plan-tier";

type MeUser = {
  plan?: string;
  onboardingCompleted?: boolean;
};

export function NexaTrainerDock() {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [upgradeGate, setUpgradeGate] = useState<{
    open: boolean;
    message: string;
    variant?: "default" | "toprank";
  }>({ open: false, message: "" });
  const conversationIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("nexa_trainer_conversation_id");
    if (stored) conversationIdRef.current = stored;
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = (await res.json().catch(() => ({}))) as {
          profile?: MeUser;
          success?: boolean;
        };
        if (res.ok && data.profile?.plan) setPlan(data.profile.plan);
      } catch {
        setPlan(null);
      } finally {
        setLoadingMe(false);
      }
    })();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setError("");
    setSending(true);
    setMessages((m) => [...m, { role: "user", text }]);

    try {
      const res = await fetch("/api/nexa/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          capability: "EXAM_TIPS",
          conversationId: conversationIdRef.current ?? undefined,
        }),
      });

      const cid = res.headers.get("X-Conversation-Id");
      if (cid) {
        conversationIdRef.current = cid;
        sessionStorage.setItem("nexa_trainer_conversation_id", cid);
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
        if (errData.upgradeRequired) setUpgradeGate({ open: true, message: msg, variant: "toprank" });
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

      const dec = new TextDecoder();
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = { role: "assistant", text: acc };
          }
          return copy;
        });
      }
    } catch {
      setMessages((m) => (m[m.length - 1]?.role === "user" ? m.slice(0, -1) : m));
      setError("Network error.");
    } finally {
      setSending(false);
    }
  }, [input, sending]);

  return (
    <>
      <button
        type="button"
        aria-label="Open Nexa rank coach"
        onClick={() => setOpen((v) => !v)}
        className="fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-lg font-black text-white shadow-lg ring-2 ring-amber-200/40 transition hover:brightness-110"
        style={{
          right: "max(1rem, env(safe-area-inset-right))",
          bottom: "max(5.75rem, calc(env(safe-area-inset-bottom) + 5.25rem))",
        }}
      >
        N
      </button>

      {open ? (
        <div
          className="fixed z-[70] flex max-h-[min(72vh,520px)] w-[min(100vw-1.5rem,380px)] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl"
          style={{
            right: "max(0.75rem, env(safe-area-inset-right))",
            bottom: "max(6.5rem, calc(env(safe-area-inset-bottom) + 6rem))",
          }}
        >
          <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Nexa</p>
              <p className="text-[11px] text-zinc-500">Rank coach — not a generic chat</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Close
            </button>
          </div>

          {loadingMe ? (
            <p className="p-4 text-sm text-zinc-500">Loading…</p>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
                {messages.length === 0 ? (
                  <p className="text-xs leading-relaxed text-zinc-500">
                    Ask anything — answers stay{" "}
                    <span className="font-medium text-zinc-300">training-focused</span> (weak topics, next test,
                    pacing).
                    {plan === "BASIC" ? (
                      <span className="mt-1 block text-amber-200/80">Basic: 5 coach messages per day.</span>
                    ) : null}
                    {plan && isTopRankPlan(plan) ? (
                      <span className="mt-1 block text-amber-200/80">TopRank: maximum discipline tone.</span>
                    ) : null}
                  </p>
                ) : null}
                {messages.map((msg, i) => (
                  <div
                    key={`${i}-${msg.role}`}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      msg.role === "user" ? "ml-6 bg-amber-900/35 text-amber-50" : "mr-4 bg-zinc-900 text-zinc-100"
                    }`}
                  >
                    {msg.text || (msg.role === "assistant" && sending ? "…" : "")}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              {error ? <p className="px-3 pb-1 text-xs text-red-400">{error}</p> : null}
              <form
                className="flex gap-2 border-t border-zinc-800 p-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Weak topic? Next mock?"
                  className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="shrink-0 rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Send
                </button>
              </form>
              <p className="border-t border-zinc-800 px-3 py-2 text-[10px] text-zinc-500">
                Need more?{" "}
                <Link href="/pricing" className="font-medium text-amber-400 underline">
                  Upgrade
                </Link>
              </p>
            </>
          )}
        </div>
      ) : null}

      <UpgradeGateModal
        open={upgradeGate.open}
        variant={upgradeGate.variant ?? "default"}
        message={upgradeGate.message}
        onClose={() => setUpgradeGate((g) => ({ ...g, open: false }))}
      />
    </>
  );
}
