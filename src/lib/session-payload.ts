/** JWT session: user id + onboarding gate + role for middleware routing. */
export type AppUserRole = "STUDENT" | "TEACHER";

export type SessionPayload = {
  userId: string;
  /** When false or omitted (legacy tokens), user must complete onboarding (students). */
  onboardingCompleted?: boolean;
  /** Omitted in legacy tokens → treated as STUDENT in middleware. */
  role?: AppUserRole;
};

export function normalizeSessionPayload(decoded: unknown): SessionPayload | null {
  if (!decoded || typeof decoded !== "object") return null;
  const o = decoded as Record<string, unknown>;
  if (typeof o.userId !== "string" || o.userId.length === 0) return null;
  let onboardingCompleted: boolean | undefined;
  if (typeof o.onboardingCompleted === "boolean") {
    onboardingCompleted = o.onboardingCompleted;
  }
  let role: AppUserRole | undefined;
  if (o.role === "TEACHER" || o.role === "STUDENT") {
    role = o.role;
  }
  return { userId: o.userId, onboardingCompleted, role };
}
