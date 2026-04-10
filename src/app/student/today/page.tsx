import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { StudentTodayClient } from "@/components/student-today-client";

export default async function StudentTodayPage() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") {
    redirect("/auth/login");
  }

  await applyPlanExpiry(session.userId);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      roles: true,
      plan: true,
      subscriptionStatus: true,
      planExpiry: true,
    },
  });

  if (!user?.roles.includes("STUDENT")) {
    redirect("/auth/login");
  }

  const paidActive =
    user.subscriptionStatus === "ACTIVE" && Boolean(user.planExpiry && user.planExpiry > new Date());

  return <StudentTodayClient previewOnly={!paidActive} userName={user.name} plan={user.plan} />;
}
