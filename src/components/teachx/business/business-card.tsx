import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
};

export function BusinessCard({ title, subtitle, children, className = "" }: Props) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm shadow-slate-200/50 backdrop-blur-sm ${className}`}
    >
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
