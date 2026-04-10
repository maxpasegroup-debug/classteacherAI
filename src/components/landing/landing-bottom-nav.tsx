"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/#system", label: "System", icon: GridIcon },
  { href: "/#pricing", label: "Pricing", icon: TagIcon },
  { href: "/auth/login", label: "Login", icon: UserIcon },
] as const;

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? "text-zinc-900" : "text-zinc-500"}>
      <path
        d="M4 11.5 12 4l8 7.5M6 10.5V20h4v-5h4v5h4V10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? "text-zinc-900" : "text-zinc-500"}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function TagIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? "text-zinc-900" : "text-zinc-500"}>
      <path
        d="M4 5.5h6l9 9-6 6-9-9V5.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="8.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? "text-zinc-900" : "text-zinc-500"}>
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 20v-1.2c0-2.8 2.6-5.1 6.5-5.1s6.5 2.3 6.5 5.1V20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LandingBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/30 bg-white/55 backdrop-blur-2xl md:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 10px)" }}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : href.startsWith("/#")
                ? false
                : pathname === href;
          return (
            <Link
              key={href + label}
              href={href}
              className="flex min-h-[52px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold tracking-wide text-zinc-600 transition active:scale-[0.97]"
            >
              <Icon active={active} />
              <span className={active ? "text-zinc-900" : "text-zinc-500"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
