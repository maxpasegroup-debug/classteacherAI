"use client";

import Link from "next/link";
import { useMarketingAppHref } from "@/components/marketing/marketing-auth-context";

type Variant = "primary" | "secondary" | "light" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 hover:shadow-xl",
  secondary:
    "inline-flex items-center justify-center rounded-2xl border border-slate-200/90 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50",
  light:
    "inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-md transition hover:bg-slate-100",
  ghost:
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 hover:text-sky-900",
};

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  /** Extra classes merged with variant (e.g. h-14 w-full). */
  stretch?: boolean;
};

export function MarketingCta({ children, variant = "primary", className = "", stretch }: Props) {
  const { appHomeHref } = useMarketingAppHref();
  const base = variants[variant];
  const stretchCls = stretch ? " w-full sm:w-auto min-h-[3rem]" : "";
  return (
    <Link href={appHomeHref} className={`${base}${stretchCls} ${className}`.trim()}>
      {children}
    </Link>
  );
}
