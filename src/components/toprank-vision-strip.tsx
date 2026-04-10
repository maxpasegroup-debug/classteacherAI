"use client";

import Link from "next/link";
import type { TopRankVisionDto } from "@/components/toprank-hub-client";

export function TopRankVisionStrip({ vision }: { vision: TopRankVisionDto }) {
  return (
    <section className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/50 to-amber-950/20 p-3 ring-1 ring-white/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-300/90">Vision board</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white">{vision.goalCardLine}</p>
          <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{vision.dreamCollege}</p>
        </div>
        <Link
          href="/student/toprank"
          className="shrink-0 rounded-lg border border-zinc-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-200"
        >
          Edit
        </Link>
      </div>
    </section>
  );
}
