import Link from "next/link";
import { HeaderDashboardLink } from "@/components/header-dashboard-link";

type HeaderProps = {
  title: string;
  subtitle?: string;
};

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 px-4 pb-3 pt-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">ClassteacherAI</p>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <HeaderDashboardLink />
          <Link
            href="/notifications"
            className="relative rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            Alerts
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500" />
          </Link>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 shadow-[0_8px_20px_-8px_rgba(16,185,129,0.6)]" />
        </div>
      </div>
    </header>
  );
}
