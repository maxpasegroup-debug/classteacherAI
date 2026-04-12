"use client";

import { useState } from "react";
import { NexaAssistant } from "@/components/NexaAssistant";
import { NexaInsightsPanel } from "@/components/nexa-insights-panel";
import { NexaSmartActions } from "@/components/nexa-smart-actions";
import { defaultQuickPrompts } from "@/lib/nexa-assistant-context";

export function AdminNexaBossPanel() {
  const [queue, setQueue] = useState<{ t: string; n: number } | null>(null);

  return (
    <div className="mt-10 space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Nexa · Boss panel (prep)</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">Operational intelligence</h2>
        <p className="mt-2 text-sm text-slate-600">
          UI scaffolding for admin-only Nexa — analyze users, surface improvements, and growth levers. Heavy analytics
          wiring comes later.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { t: "User cohorts", d: "Activation, churn risk, plan mix (placeholder)." },
            { t: "Quality signals", d: "Nexa threads, exam volume, support themes (placeholder)." },
            { t: "Growth levers", d: "Pricing tests, partner funnel, content gaps (placeholder)." },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-semibold text-slate-800">{c.t}</p>
              <p className="mt-1 text-xs text-slate-600">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5">
        <p className="text-xs font-semibold text-violet-800">Smart actions</p>
        <div className="mt-3">
          <NexaSmartActions
            theme="light"
            actions={defaultQuickPrompts("ADMIN", "admin")}
            onSelect={(prompt) => setQueue({ t: prompt, n: Date.now() })}
          />
        </div>
      </div>

      <NexaInsightsPanel
        theme="light"
        insights={[
          { id: "a1", text: "Watch Basic → Pro conversion after day-3 exam completion — typical activation window." },
          { id: "a2", text: "Teachers with Business plans should see tutor application throughput — backlog is a revenue cap." },
          { id: "a3", text: "If practice consistency drops platform-wide, prioritize one high-visibility challenge on /student/today." },
        ]}
      />

      <NexaAssistant
        role="ADMIN"
        module="admin"
        theme="light"
        storageKey="nexa_asst_admin_boss"
        injectPrompt={queue?.t ?? null}
        injectNonce={queue?.n ?? 0}
        onInjectConsumed={() => setQueue(null)}
      />
    </div>
  );
}
