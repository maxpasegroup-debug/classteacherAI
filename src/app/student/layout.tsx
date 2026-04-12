import type { ReactNode } from "react";
import { NexaTrainerDock } from "@/components/nexa-trainer-dock";
import { StudentEliteNav } from "@/components/student-elite-nav";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
      <div className="mx-auto w-full max-w-lg px-4 pb-[max(5.5rem,env(safe-area-inset-bottom)+4.5rem)] pt-3 sm:max-w-xl">
        {children}
      </div>
      <NexaTrainerDock />
      <StudentEliteNav />
    </div>
  );
}
