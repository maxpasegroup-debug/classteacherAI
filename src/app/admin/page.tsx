import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdminEmail(email: string) {
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return list.includes(email);
}

export default async function AdminPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  if (!user || !isAdminEmail(user.email)) {
    redirect("/student/today");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-600">
          Use <code>/api/admin/dashboard</code> with admin email allowlist (<code>ADMIN_EMAILS</code>) to access platform analytics.
        </p>
      </section>
    </main>
  );
}
