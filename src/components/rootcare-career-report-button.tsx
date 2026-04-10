"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InlineNotice } from "@/components/ui-states";

export function RootcareCareerReportButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setOk("");
    try {
      const res = await fetch("/api/rootcare/career-report", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not create report.");
        return;
      }
      setOk("Report saved.");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void generate()}
        disabled={loading}
        className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-100 disabled:opacity-60"
      >
        {loading ? "Generating…" : "Generate career suggestions"}
      </button>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      {ok ? <InlineNotice tone="success">{ok}</InlineNotice> : null}
    </div>
  );
}
