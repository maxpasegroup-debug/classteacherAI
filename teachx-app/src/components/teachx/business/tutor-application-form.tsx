"use client";

import Image from "next/image";
import { FormEvent, useCallback, useState } from "react";
import { BusinessCard } from "@/components/teachx/business/business-card";

const MAX_FILE_BYTES = 280 * 1024;

type Props = {
  initialPending: boolean;
};

export function TutorApplicationForm({ initialPending }: Props) {
  const [submitted, setSubmitted] = useState(initialPending);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);

  const onPhoto = useCallback((file: File | null) => {
    setError("");
    setPhotoPreview(null);
    setPhotoDataUrl(undefined);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Photo must be under 280 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") {
        setPhotoDataUrl(r);
        setPhotoPreview(r);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      type: "TUTOR_ONE_ON_ONE" as const,
      payload: {
        displayName: String(fd.get("displayName") ?? "").trim(),
        subjects: String(fd.get("subjects") ?? "").trim(),
        experience: String(fd.get("experience") ?? "").trim(),
        pricingHourly: String(fd.get("pricingHourly") ?? "").trim(),
        pricingWeekly: String(fd.get("pricingWeekly") ?? "").trim(),
        pricingMonthly: String(fd.get("pricingMonthly") ?? "").trim(),
        description: String(fd.get("description") ?? "").trim(),
        ...(photoDataUrl ? { profilePhotoDataUrl: photoDataUrl } : {}),
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
      setPhotoPreview(null);
      setPhotoDataUrl(undefined);
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
        subtitle="We’ll notify you at your registered email once your 1:1 teaching profile has been reviewed."
      >
        <p className="text-sm text-slate-600">
          Your ClassteacherAI tutor application is in the queue. Typical review time is a few business days.
        </p>
      </BusinessCard>
    );
  }

  return (
    <BusinessCard
      title="Apply for 1:1 teaching"
      subtitle="List on ClassteacherAI — students book sessions based on your profile and rates."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

        <div>
          <label className="block text-xs font-medium text-slate-600">Profile photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(ev) => onPhoto(ev.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
          />
          {photoPreview ? (
            <Image
              src={photoPreview}
              alt=""
              width={80}
              height={80}
              unoptimized
              className="mt-2 rounded-xl object-cover ring-1 ring-slate-200"
            />
          ) : (
            <p className="mt-1 text-xs text-slate-500">Optional. Max 280 KB.</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">Name</label>
          <input
            name="displayName"
            required
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-slate-200 focus:ring-2"
            placeholder="Name as shown to students"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">Subjects</label>
          <input
            name="subjects"
            required
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="e.g. Mathematics, Physics (Class 10–12)"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">Experience</label>
          <textarea
            name="experience"
            required
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Years teaching, outcomes, certifications…"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-600">Hourly (₹)</label>
            <input
              name="pricingHourly"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="e.g. 800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Weekly (₹)</label>
            <input
              name="pricingWeekly"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="e.g. 4000"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Monthly (₹)</label>
            <input
              name="pricingMonthly"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="e.g. 14000"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">Description</label>
          <textarea
            name="description"
            required
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Teaching style, availability windows, what students can expect…"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 py-3 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {loading ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </BusinessCard>
  );
}
