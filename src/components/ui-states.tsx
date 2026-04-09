import { ReactNode } from "react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="animate-fade-in-up rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="animate-fade-in-up rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700"
        >
          {retryLabel ?? "Try again"}
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-fade-in-up rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-4 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function InlineNotice({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "warning" | "error";
  children: ReactNode;
}) {
  const cls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-blue-200 bg-blue-50 text-blue-800";
  return <p className={`animate-fade-in-up rounded-xl border px-3 py-2 text-sm ${cls}`}>{children}</p>;
}
