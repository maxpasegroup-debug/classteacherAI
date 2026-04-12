"use client";

import { useState } from "react";
import { NexaAssistant } from "@/components/NexaAssistant";
import { NexaInsightsPanel } from "@/components/nexa-insights-panel";
import { NexaSmartActions } from "@/components/nexa-smart-actions";
import { defaultQuickPrompts } from "@/lib/nexa-assistant-context";

export function TeachXBusinessNexa() {
  const [queue, setQueue] = useState<{ t: string; n: number } | null>(null);

  return (
    <>
      <div className="mt-12 space-y-4 border-t border-slate-200/80 pt-10">
        <div className="rounded-2xl border border-emerald-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Nexa · Business</p>
          <p className="mt-1 text-sm text-slate-600">Earnings and growth prompts — tied to this dashboard.</p>
          <div className="mt-4">
            <NexaSmartActions
              theme="light"
              actions={defaultQuickPrompts("TEACHER", "business")}
              onSelect={(prompt) => setQueue({ t: prompt, n: Date.now() })}
            />
          </div>
        </div>

        <NexaInsightsPanel
          theme="light"
          insights={[
            {
              id: "1",
              text: "You can earn more via 1:1 sessions — complete your ClassteacherAI tutor application early.",
            },
            { id: "2", text: "RootsCare partners win on trust: lead with assessment clarity before package talk." },
            { id: "3", text: "Skills referrals compound — share one course weekly with a personal note, not a blast." },
          ]}
        />
      </div>

      <NexaAssistant
        role="TEACHER"
        module="business"
        planLabel="BUSINESS"
        theme="light"
        storageKey="nexa_asst_teachx_business"
        injectPrompt={queue?.t ?? null}
        injectNonce={queue?.n ?? 0}
        onInjectConsumed={() => setQueue(null)}
      />
    </>
  );
}
