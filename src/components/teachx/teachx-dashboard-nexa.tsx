"use client";

import { useState } from "react";
import { NexaAssistant } from "@/components/NexaAssistant";
import { NexaInsightsPanel } from "@/components/nexa-insights-panel";
import { NexaSmartActions } from "@/components/nexa-smart-actions";
import { defaultQuickPrompts } from "@/lib/nexa-assistant-context";

type Props = {
  teachxPlan: string;
};

export function TeachXDashboardNexa({ teachxPlan }: Props) {
  const [queue, setQueue] = useState<{ t: string; n: number } | null>(null);

  return (
    <>
      <section className="mt-10 space-y-3 rounded-2xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/50 to-white p-6 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-700">Nexa</p>
        <p className="text-sm text-slate-600">Smart actions — opens the assistant with context for TeachX.</p>
        <NexaSmartActions
          theme="light"
          actions={defaultQuickPrompts("TEACHER", "dashboard")}
          onSelect={(prompt) => setQueue({ t: prompt, n: Date.now() })}
        />
      </section>

      <div className="mt-6">
        <NexaInsightsPanel
          theme="light"
          insights={[
            {
              id: "1",
              text: "Turn your strongest unit into a reusable worksheet pack — students value print-ready structure.",
            },
            {
              id: "2",
              text: "Batch feedback: draft rubric lines in Nexa, then personalize names only — saves hours weekly.",
            },
            {
              id: "3",
              text: "Business plan unlocks 1:1 earnings — list subjects you’d teach live when you upgrade.",
            },
          ]}
        />
      </div>

      <NexaAssistant
        role="TEACHER"
        module="dashboard"
        planLabel={teachxPlan}
        theme="light"
        storageKey="nexa_asst_teachx_dashboard"
        injectPrompt={queue?.t ?? null}
        injectNonce={queue?.n ?? 0}
        onInjectConsumed={() => setQueue(null)}
      />
    </>
  );
}
