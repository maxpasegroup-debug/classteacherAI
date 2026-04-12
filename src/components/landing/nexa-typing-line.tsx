"use client";

import { useEffect, useState } from "react";

const LINE = "You are losing marks to pace — next set: 10% less time, same difficulty.";

export function NexaTypingLine() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (count >= LINE.length) {
      const pause = setTimeout(() => setCount(0), 2800);
      return () => clearTimeout(pause);
    }
    const t = setTimeout(() => setCount((c) => c + 1), 42);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <p className="min-h-[3.5rem] font-mono text-sm font-medium text-violet-900/90 sm:text-base">
      <span className="text-violet-700">Nexa · </span>
      {LINE.slice(0, count)}
      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-violet-500 align-middle" aria-hidden />
    </p>
  );
}
