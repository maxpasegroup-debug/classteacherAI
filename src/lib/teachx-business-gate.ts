import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTeachxPlan } from "@/lib/teachxPlanConfig";

export type TeachxBusinessGateUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  teachxPlan: string;
};

export async function getTeachxBusinessUser(userId: string): Promise<TeachxBusinessGateUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, teachxPlan: true },
  });
}

export function isTeachxBusinessPlan(user: Pick<TeachxBusinessGateUser, "role" | "teachxPlan">): boolean {
  return user.role === "TEACHER" && normalizeTeachxPlan(user.teachxPlan) === "BUSINESS";
}

/** Server layouts/pages: teacher + TeachX BUSINESS only. */
export async function requireTeachxBusinessUser(): Promise<TeachxBusinessGateUser> {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/teachx/login");
  }
  const user = await getTeachxBusinessUser(session.userId);
  if (!user) {
    redirect("/teachx/login");
  }
  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }
  if (!isTeachxBusinessPlan(user)) {
    redirect("/teachx/pricing");
  }
  return user;
}
