"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type MarketingAuthState = {
  resolved: boolean;
  /** Where primary CTAs send signed-in users (dashboard or onboarding). */
  appHomeHref: string;
};

const MarketingAuthContext = createContext<MarketingAuthState>({
  resolved: false,
  appHomeHref: "/auth",
});

export function MarketingAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MarketingAuthState>({ resolved: false, appHomeHref: "/auth" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = (await res.json()) as {
          success?: boolean;
          user?: unknown;
          redirectTo?: string;
        };
        if (cancelled) return;
        if (data.success && data.user) {
          setState({ resolved: true, appHomeHref: data.redirectTo ?? "/dashboard" });
        } else {
          setState({ resolved: true, appHomeHref: "/auth" });
        }
      } catch {
        if (!cancelled) setState({ resolved: true, appHomeHref: "/auth" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return <MarketingAuthContext.Provider value={value}>{children}</MarketingAuthContext.Provider>;
}

export function useMarketingAppHref() {
  return useContext(MarketingAuthContext);
}
