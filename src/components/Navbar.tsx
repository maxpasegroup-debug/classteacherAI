"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/exam-coaching", label: "Exam Coaching" },
  { href: "/study-help", label: "Study Help" },
  { href: "/rootscare", label: "RootsCare" },
  { href: "/skills", label: "Skill Development" },
  { href: "/pricing", label: "Pricing" },
] as const;

const linkClass =
  "text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-black";

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="relative flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90">
          <Image
            src="/images/logo.jpg"
            alt="ClassteacherAI"
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg object-cover"
            priority
          />
          <span className="max-w-[140px] truncate text-xs font-bold tracking-tight text-slate-900 sm:max-w-none sm:text-sm md:text-base">
            CLASSTEACHERAI
          </span>
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex"
          aria-label="Main"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Link href="/auth/login" className={`hidden lg:inline-flex ${linkClass}`}>
            Login
          </Link>
          <Link
            href="/auth"
            className="hidden rounded-lg bg-black px-5 py-2 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 lg:inline-flex"
          >
            Start
          </Link>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 hover:text-black lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`border-t border-gray-200/80 bg-white/95 backdrop-blur-md lg:hidden ${menuOpen ? "block" : "hidden"}`}
      >
        <nav className="flex flex-col gap-1 px-6 py-4" aria-label="Mobile">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-black"
            >
              {label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-4">
            <Link
              href="/auth/login"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-black"
            >
              Login
            </Link>
            <Link
              href="/auth"
              className="rounded-lg bg-black px-5 py-2.5 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Start
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
