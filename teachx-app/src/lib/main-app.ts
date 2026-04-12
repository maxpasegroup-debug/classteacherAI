/** ClassteacherAI main app (student + APIs host). TeachX frontend uses this for external links and non-teacher redirects. */

export function mainClassteacherOrigin(): string {
  return (process.env.NEXT_PUBLIC_MAIN_APP_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
}

export function nexaWorkspaceUrl(): string {
  return `${mainClassteacherOrigin()}/nexa`;
}
