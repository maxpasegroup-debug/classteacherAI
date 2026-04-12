"use client";

import Link from "next/link";
import { useEffect } from "react";

type UpgradeGateModalProps = {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  /** `toprank` = conversion-focused TopRank upsell; `teachx` = teacher Nexa / TeachX plans */
  variant?: "default" | "toprank" | "teachx";
  ctaLabel?: string;
  ctaHref?: string;
};

export function UpgradeGateModal({
  open,
  title,
  message,
  onClose,
  variant = "default",
  ctaLabel,
  ctaHref,
}: UpgradeGateModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isTopRank = variant === "toprank";
  const isTeachx = variant === "teachx";
  const resolvedTitle =
    title ??
    (isTopRank
      ? "Top rankers train differently."
      : isTeachx
        ? "Upgrade to unlock Nexa intelligence"
        : "Upgrade to continue");
  const resolvedCta =
    ctaLabel ?? (isTopRank ? "Upgrade to TopRank" : isTeachx ? "View TeachX plans" : "Upgrade now");
  const resolvedHref = ctaHref ?? (isTopRank ? "/pricing#toprank" : isTeachx ? "/pricing" : "/pricing");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-gate-title"
    >
      <button type="button" className="absolute inset-0 cursor-default bg-slate-900/60" aria-label="Close" onClick={onClose} />
      <div
        className={`relative z-10 w-full max-w-md rounded-2xl border p-5 shadow-xl ${
          isTopRank
            ? "border-amber-400/50 bg-gradient-to-b from-zinc-900 to-black text-white ring-1 ring-amber-500/30"
            : isTeachx
              ? "border-blue-300/80 bg-gradient-to-b from-blue-50 to-white ring-1 ring-blue-500/20"
              : "border-amber-200/80 bg-white"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${
            isTopRank ? "text-amber-300/90" : isTeachx ? "text-blue-700" : "text-amber-800"
          }`}
        >
          {isTopRank ? "Unlock the loop" : isTeachx ? "TeachX" : "Plan limit"}
        </p>
        <h3
          id="upgrade-gate-title"
          className={`mt-1 text-lg font-semibold ${isTopRank ? "text-white" : "text-slate-900"}`}
        >
          {resolvedTitle}
        </h3>
        <p className={`mt-2 text-sm ${isTopRank ? "text-zinc-300" : "text-slate-600"}`}>{message}</p>
        {isTopRank ? (
          <p className="mt-3 text-xs text-amber-200/80">
            Adaptive difficulty, forced retries, and the continuous exam loop — built for students who refuse to plateau.
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className={`w-full rounded-xl border px-4 py-2 text-sm font-medium ${
              isTopRank
                ? "border-zinc-600 text-zinc-200 hover:bg-zinc-800"
                : isTeachx
                  ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                  : "border-slate-200 text-slate-700"
            }`}
          >
            Not now
          </button>
          <Link
            href={resolvedHref}
            className={`w-full rounded-xl px-4 py-2 text-center text-sm font-semibold ${
              isTopRank
                ? "bg-gradient-to-r from-amber-400 to-orange-500 text-zinc-950 hover:opacity-95"
                : isTeachx
                  ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:opacity-95"
                  : "bg-slate-900 text-white"
            }`}
            onClick={onClose}
          >
            {resolvedCta}
          </Link>
        </div>
      </div>
    </div>
  );
}
