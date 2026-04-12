import type { ReactNode } from "react";

export default function TeachXRouteGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      {children}
    </div>
  );
}
