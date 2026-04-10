"use client";

import Link from "next/link";
import { useEffect } from "react";

type UnlockRankJourneyModalProps = {
  open: boolean;
  onClose: () => void;
};

export function UnlockRankJourneyModal({ open, onClose }: UnlockRankJourneyModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-rank-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-900/20">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <span className="text-lg leading-none">×</span>
        </button>
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">ClassteacherAI</p>
        <h2 id="unlock-rank-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Unlock Your Rank Journey
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Explore the platform preview, then subscribe to attempt exams, unlock analytics, and turn on AI coaching at the
          level that fits your goals.
        </p>
        <ul className="mt-4 space-y-2 border-y border-slate-100 py-4 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="font-medium text-slate-900">Starter</span>
            <span className="text-slate-500">—</span>
            <span>Limited attempts, basic analytics, full UI access</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-slate-900">Pro</span>
            <span className="text-slate-500">—</span>
            <span>Full exams, adaptive practice, limited Nexa coaching</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-slate-900">TopRank</span>
            <span className="text-slate-500">—</span>
            <span>Hardcore AI trainer, missions, weakness targeting, exam simulations</span>
          </li>
        </ul>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href="/pricing#starter"
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Start with ₹499
          </Link>
          <Link
            href="/pricing#compare"
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Upgrade to Pro / TopRank
          </Link>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">Secure checkout · INR · Razorpay</p>
      </div>
    </div>
  );
}
