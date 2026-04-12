"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Mobile-first bottom bar — five core actions only. */
const ITEMS = [
  { href: "/student/today", label: "Home", match: (p: string) => p === "/student/today" || p === "/student" },
  { href: "/student/exams", label: "Exam", match: (p: string) => p.startsWith("/student/exams") },
  { href: "/student/performance", label: "Rank", match: (p: string) => p.startsWith("/student/performance") },
  { href: "/nexa", label: "Nexa", match: (p: string) => p === "/nexa" || p.startsWith("/nexa/") },
  { href: "/student/profile", label: "Profile", match: (p: string) => p.startsWith("/student/profile") },
] as const;

export function StudentEliteNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/90 bg-zinc-950/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md"
      aria-label="Student navigation"
    >
      <div className="mx-auto flex max-w-lg justify-between gap-0.5 px-2">
        {ITEMS.map(({ href, label, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center rounded-lg px-1 py-2 text-center transition ${
                active ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              <span className="block text-[10px] font-semibold leading-tight tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
