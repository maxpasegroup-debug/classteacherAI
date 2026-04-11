import { redirect } from "next/navigation";

/** Legacy teacher UI — student-only app redirects to the student hub. */
export default function TeacherDashboardRedirectPage() {
  redirect("/student/today");
}
