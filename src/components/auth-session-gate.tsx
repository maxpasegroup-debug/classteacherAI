"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Client-side session check (complements server redirects). Keeps stale tabs honest.
 */
export function AuthSessionGate({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = (await res.json()) as {
          authenticated?: boolean;
          success?: boolean;
          user?: unknown;
        };
        if (cancelled) return;
        const ok =
          res.ok && (data.authenticated === true || (data.success === true && data.user != null));
        if (!ok) {
          router.replace("/auth/login");
        }
      } catch {
        if (!cancelled) router.replace("/auth/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return children;
}
