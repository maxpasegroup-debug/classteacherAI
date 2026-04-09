"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";

type MainAppShellProps = {
  children: ReactNode;
};

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/today": { title: "Today", subtitle: "Your smart daily learning feed" },
  "/nexa": { title: "Nexa AI", subtitle: "Chat and voice AI classroom assistant" },
  "/classes": { title: "Classes", subtitle: "Track ongoing classes and sessions" },
};

export function MainAppShell({ children }: MainAppShellProps) {
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? { title: "ClassteacherAI", subtitle: "AI-powered learning app" };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-emerald-50/40">
      <Header title={meta.title} subtitle={meta.subtitle} />
      <main className="mx-auto w-full max-w-md px-4 pb-28 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
