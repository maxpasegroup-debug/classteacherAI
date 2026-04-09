"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-200px] h-[430px] w-[430px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-400/25 via-cyan-300/20 to-emerald-400/25 blur-[90px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8"
      >
        <Link href="/" className="mb-6 inline-flex items-center gap-2">
          <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400" />
          <span className="text-sm font-semibold tracking-tight text-slate-800">ClassteacherAI</span>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 text-sm text-slate-600">{footer}</div> : null}
      </motion.div>
    </div>
  );
}
