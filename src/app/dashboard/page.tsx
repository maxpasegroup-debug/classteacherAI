import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/auth/login");
  }

  const destination = session.activeRole === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard";
  redirect(destination);
}
