/**
 * Teacher signup must come from the TeachX signup surface (header or Referer).
 * Student signup is the default when this is false.
 */
export function isTeachxSignupRequest(req: Request): boolean {
  if (req.headers.get("x-signup-source") === "teachx") return true;
  const referer = req.headers.get("referer") ?? "";
  try {
    const path = new URL(referer).pathname;
    return path === "/teachx/signup" || path.startsWith("/teachx/signup/");
  } catch {
    return false;
  }
}
