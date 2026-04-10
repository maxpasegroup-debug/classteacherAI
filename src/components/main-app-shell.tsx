"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { StudentEliteNav } from "@/components/student-elite-nav";

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
  const [studentMode] = useState(true);

  const bottomPad = studentMode ? "pb-[max(5.5rem,env(safe-area-inset-bottom)+4.5rem)]" : "pb-28";

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-emerald-50/40">
      <Header title={meta.title} subtitle={meta.subtitle} />
      <main className={`mx-auto w-full max-w-md px-4 pt-4 ${bottomPad}`}>{children}</main>
      {studentMode ? <StudentEliteNav /> : null}
    </div>
  );
}
