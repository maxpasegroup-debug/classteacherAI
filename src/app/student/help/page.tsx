import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentStudyHelpClient } from "@/components/student-study-help-client";

export default async function StudentHelpPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true },
  });
  if (!user) redirect("/auth/login");

  return (
    <>
      <header className="mb-5 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">Support</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Study help</h1>
        <p className="text-sm text-zinc-400">Request a topic â€” get matched with a teacher.</p>
      </header>
      <StudentStudyHelpClient />
    </>
  );
}
