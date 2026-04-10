"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Resolves to the correct home hub so students are not bounced through /dashboard.
 */
export function HeaderDashboardLink() {
  const [href, setHref] = useState("/dashboard");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json().catch(() => ({}));
        const role = data?.user?.activeRole;
        if (cancelled) return;
        if (role === "STUDENT") setHref("/student/today");
        else if (role === "TEACHER") setHref("/teacher/dashboard");
      } catch {
        /* keep /dashboard */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href={href}
      className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 sm:px-2.5 sm:text-xs"
    >
      Dashboard
    </Link>
  );
}
