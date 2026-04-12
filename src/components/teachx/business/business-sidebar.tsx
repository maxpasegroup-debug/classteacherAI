"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { href: string; label: string }[] = [
  { href: "/teachx/business", label: "Overview" },
  { href: "/teachx/business/teaching", label: "1:1 Teaching (ClassteacherAI)" },
  { href: "/teachx/business/rootscare", label: "RootsCare Franchise" },
  { href: "/teachx/business/skills", label: "Skills Academy" },
  { href: "/teachx/business/earnings", label: "Earnings" },
  { href: "/teachx/business/applications", label: "Applications" },
];

export function BusinessSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-white/10 bg-slate-950/95 lg:w-60 lg:border-b-0 lg:border-r">
      <div className="px-4 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-400/90">TeachX</p>
        <p className="mt-1 text-sm font-bold text-white">Business</p>
      </div>
      <nav className="flex flex-row gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:px-3 lg:pb-6">
        {NAV.map((item) => {
          const active =
            item.href === "/teachx/business"
              ? pathname === "/teachx/business"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition lg:whitespace-normal ${
                active
                  ? "bg-white/10 font-semibold text-white ring-1 ring-white/15"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden border-t border-white/10 p-4 text-xs text-slate-500 lg:block">
        ClassteacherAI partner hub
      </div>
    </aside>
  );
}
