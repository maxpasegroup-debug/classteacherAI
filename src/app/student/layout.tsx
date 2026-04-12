import type { ReactNode } from "react";
import { AuthSessionGate } from "@/components/auth-session-gate";
import { StudentLayoutNexa } from "@/components/student-layout-nexa";
import { StudentEliteNav } from "@/components/student-elite-nav";
import { getCurrentSession } from "@/lib/auth";
import { requireActiveStudentAppAccess } from "@/lib/student-app-gate";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  if (session) {
    await requireActiveStudentAppAccess(session.userId);
  }

  return (
    <AuthSessionGate>
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
        <div className="mx-auto w-full max-w-lg px-4 pb-[max(5.5rem,env(safe-area-inset-bottom)+4.5rem)] pt-3 sm:max-w-xl">
          {children}
        </div>
        <StudentLayoutNexa />
        <StudentEliteNav />
      </div>
    </AuthSessionGate>
  );
}
