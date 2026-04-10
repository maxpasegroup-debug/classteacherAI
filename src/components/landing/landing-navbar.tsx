"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const linkClass =
  "text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 min-h-[44px] inline-flex items-center";

export function LandingNavbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-30 hidden border-b border-zinc-200/60 bg-white/70 backdrop-blur-xl md:block"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-zinc-900">
          ClassteacherAI
        </Link>
        <nav className="flex items-center gap-8" aria-label="Primary">
          <a href="#system" className={linkClass}>
            System
          </a>
          <a href="#how-it-works" className={linkClass}>
            How it Works
          </a>
          <a href="#pricing" className={linkClass}>
            Pricing
          </a>
          <Link href="/auth/login" className={linkClass}>
            Login
          </Link>
        </nav>
        <Link
          href="/auth/signup"
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-zinc-900/10 transition hover:bg-zinc-800 min-h-[44px] inline-flex items-center"
        >
          Start Training
        </Link>
      </div>
    </motion.header>
  );
}
