import { canAccessStudentApp, type PlanUserSnapshot } from "@/lib/plan-access";

export type StudentEntryPath = "/onboarding" | "/plans" | "/student/today";

export type PostAuthRedirectPath = StudentEntryPath | "/teachx/dashboard";

/** Central post-login path: teachers → TeachX; students → onboarding / plans / student home. */
export function resolvePostAuthRedirect(
  onboardingCompleted: boolean,
  user: PlanUserSnapshot & { role: string },
): PostAuthRedirectPath {
  if (user.role === "TEACHER") return "/teachx/dashboard";
  if (!onboardingCompleted) return "/onboarding";
  if (!canAccessStudentApp(user)) return "/plans";
  return "/student/today";
}
