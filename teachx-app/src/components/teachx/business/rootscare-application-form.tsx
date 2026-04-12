"use client";

import { FormEvent, useState } from "react";
import { BusinessCard } from "@/components/teachx/business/business-card";

type Props = {
  initialPending: boolean;
};

export function RootscareApplicationForm({ initialPending }: Props) {
  const [submitted, setSubmitted] = useState(initialPending);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      type: "ROOTSCARE_PARTNER" as const,
      payload: {
        displayName: String(fd.get("displayName") ?? "").trim(),
        experience: String(fd.get("experience") ?? "").trim(),
        location: String(fd.get("location") ?? "").trim(),
        interestLevel: String(fd.get("interestLevel") ?? "").trim(),
      },
    };

    setLoading(true);
    try {
      const res = await fetch("/api/business/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        setError(typeof data.message === "string" ? data.message : "Could not submit.");
        return;
      }
      setSubmitted(true);
      e.currentTarget.reset();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <BusinessCard
        title="Application under review"
        subtitle="Our RootsCare partnerships team will reach out about next steps."
      >
        <p className="text-sm text-slate-600">
          Thank you for your interest in becoming a RootsCare Career Partner.
        </p>
      </BusinessCard>
    );
  }

  return (
    <BusinessCard title="Partner application" subtitle="Tell us about your practice and location.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

        <div>
          <label className="block text-xs font-medium text-slate-600">Name</label>
          <input
            name="displayName"
            required
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">Experience</label>
          <textarea
            name="experience"
            required
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Counseling, coaching, or education background…"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">Location</label>
          <input
            name="location"
            required
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="City, state / region"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">Interest level</label>
          <select
            name="interestLevel"
            required
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            defaultValue=""
          >
            <option value="" disabled>
              Select…
            </option>
            <option value="Exploring">Exploring — learning about the program</option>
            <option value="Interested">Interested — want a discovery call</option>
            <option value="Ready">Ready — prepared to onboard this quarter</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 px-8 py-3 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </BusinessCard>
  );
}
