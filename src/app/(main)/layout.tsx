import type { ReactNode } from "react";
import { MainAppShell } from "@/components/main-app-shell";
import { getCurrentSession } from "@/lib/auth";
import { requireActiveStudentAppAccess } from "@/lib/student-app-gate";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  if (session) {
    await requireActiveStudentAppAccess(session.userId);
  }

  return <MainAppShell>{children}</MainAppShell>;
}
