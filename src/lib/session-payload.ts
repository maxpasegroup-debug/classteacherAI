/** Minimal JWT session: only user id (source of truth is DB via /api/auth/me). */
export type SessionPayload = {
  userId: string;
};

export function normalizeSessionPayload(decoded: unknown): SessionPayload | null {
  if (!decoded || typeof decoded !== "object") return null;
  const o = decoded as Record<string, unknown>;
  if (typeof o.userId !== "string" || o.userId.length === 0) return null;
  return { userId: o.userId };
}
