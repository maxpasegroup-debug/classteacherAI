"use client";

import { usePathname } from "next/navigation";
import { NexaTrainerDock } from "@/components/nexa-trainer-dock";

/** Today page uses the full Nexa Assistant stack; other student routes keep the trainer dock. */
export function StudentLayoutNexa() {
  const pathname = usePathname();
  if (pathname === "/student/today" || pathname?.startsWith("/student/today/")) {
    return null;
  }
  return <NexaTrainerDock />;
}
