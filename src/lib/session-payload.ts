/** JWT session: user id + onboarding gate for middleware (refreshed from DB on login/me/onboarding). */
export type SessionPayload = {
  userId: string;
  /** When false or omitted (legacy tokens), user must complete onboarding. */
  onboardingCompleted?: boolean;
};

export function normalizeSessionPayload(decoded: unknown): SessionPayload | null {
  if (!decoded || typeof decoded !== "object") return null;
  const o = decoded as Record<string, unknown>;
  if (typeof o.userId !== "string" || o.userId.length === 0) return null;
  let onboardingCompleted: boolean | undefined;
  if (typeof o.onboardingCompleted === "boolean") {
    onboardingCompleted = o.onboardingCompleted;
  }
  return { userId: o.userId, onboardingCompleted };
}
