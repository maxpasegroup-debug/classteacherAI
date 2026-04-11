import { redirect } from "next/navigation";

export default function TeacherAdvancedRedirectPage() {
  redirect("/student/today");
}
