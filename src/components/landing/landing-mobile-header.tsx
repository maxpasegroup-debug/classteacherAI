"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function LandingMobileHeader() {
  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="sticky top-0 z-30 border-b border-white/40 bg-white/65 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto flex h-14 max-w-lg items-center justify-center px-4">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-zinc-900">
          ClassteacherAI
        </Link>
      </div>
    </motion.header>
  );
}
