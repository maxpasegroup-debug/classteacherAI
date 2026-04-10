"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/student/today", label: "Today", match: (p: string) => p === "/student/today" || p === "/student" },
  { href: "/nexa", label: "Nexa", match: (p: string) => p === "/nexa" || p.startsWith("/nexa/") },
  { href: "/student/toprank", label: "Rank", match: (p: string) => p.startsWith("/student/toprank") || p.startsWith("/student/top10") },
  { href: "/student/exams", label: "Exams", match: (p: string) => p.startsWith("/student/exams") },
  { href: "/student/performance", label: "Stats", match: (p: string) => p.startsWith("/student/performance") },
  { href: "/rootcare", label: "Root", match: (p: string) => p.startsWith("/rootcare") },
  { href: "/student/help", label: "Help", match: (p: string) => p.startsWith("/student/help") },
  { href: "/student/profile", label: "You", match: (p: string) => p.startsWith("/student/profile") },
] as const;

export function StudentEliteNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/90 bg-zinc-950/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md"
      aria-label="Student navigation"
    >
      <div className="mx-auto flex max-w-lg snap-x snap-mandatory gap-0.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map(({ href, label, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`min-w-[3.65rem] flex-shrink-0 snap-center rounded-lg px-1.5 py-2 text-center transition ${
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
