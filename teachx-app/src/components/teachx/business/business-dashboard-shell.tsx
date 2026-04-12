"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BusinessSidebar } from "@/components/teachx/business/business-sidebar";
import { TeachXLogoutButton } from "@/components/teachx/teachx-logout-button";

type Props = {
  children: ReactNode;
  userName: string;
};

export function BusinessDashboardShell({ children, userName }: Props) {
  const first = userName.trim().split(/\s+/)[0] ?? "Partner";

  return (
    <div className="min-h-screen bg-[#0c1222]">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-base font-extrabold tracking-tight text-white">
              <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                TEACHX
              </span>
              <span className="ml-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Business</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:inline">Hi, {first}</span>
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5"
            >
              Main dashboard
            </Link>
            <TeachXLogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] flex-col lg:flex-row lg:min-h-[calc(100vh-57px)]">
        <BusinessSidebar />
        <div className="flex-1 bg-gradient-to-b from-slate-100 to-slate-200/90">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:max-w-none lg:px-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
