"use client";

import { useEffect } from "react";

type UpgradeModalProps = {
  open: boolean;
  title: string;
  description: string;
  /** Optional extra line (e.g. credits included). */
  detail?: string;
  amountInr: number;
  /** Shown under price, e.g. "Billed monthly · renews each cycle" */
  billingNote?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function UpgradeModal({
  open,
  title,
  description,
  detail,
  amountInr,
  billingNote = "Secure payment via Razorpay · INR",
  loading = false,
  onClose,
  onConfirm,
}: UpgradeModalProps) {
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
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-900/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-100 bg-white p-5 shadow-xl">
        <h3 id="upgrade-modal-title" className="text-lg font-semibold text-slate-900">
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
        {detail ? <p className="mt-2 text-sm font-medium text-slate-800">{detail}</p> : null}
        <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-2xl font-semibold text-slate-900">₹{amountInr}</p>
          <p className="text-xs text-slate-500">{billingNote}</p>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Processing…" : "Pay with Razorpay"}
          </button>
        </div>
      </div>
    </div>
  );
}
