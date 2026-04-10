"use client";

import Link from "next/link";

/**
 * Resolves to the correct home hub so students are not bounced through /dashboard.
 */
export function HeaderDashboardLink() {
  return (
    <Link
      href="/dashboard"
      className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 sm:px-2.5 sm:text-xs"
    >
      Dashboard
    </Link>
  );
}
