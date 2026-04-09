import { ReactNode } from "react";

type CardUIProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  /** `elite`: clean white, subtle ring — training hub default. */
  variant?: "default" | "elite";
};

export function CardUI({ title, description, children, className = "", variant = "default" }: CardUIProps) {
  const base =
    variant === "elite"
      ? "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/[0.04]"
      : "rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.5)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(15,23,42,0.45)]";
  return (
    <article className={`animate-fade-in-up ${base} ${className}`}>
      <h3 className={`font-semibold text-slate-900 ${variant === "elite" ? "text-base tracking-tight" : "text-sm"}`}>
        {title}
      </h3>
      {description ? (
        <p className={`mt-1 text-slate-600 ${variant === "elite" ? "text-sm leading-relaxed" : "text-sm"}`}>
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </article>
  );
}
