import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";

export default async function TodayPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/auth/login");
  }

  redirect("/student/today");
}
