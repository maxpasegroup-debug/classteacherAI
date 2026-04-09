import type { SubscriptionPlan } from "@prisma/client";

/**
 * JWT session claims. `activeRole` is the dashboard/API context; `roles` is what the account may use.
 * Plan fields are optional for legacy tokens; refreshed on login and `/api/auth/me`.
 */
export type SessionPayload = {
  userId: string;
  email: string;
  roles: ("TEACHER" | "STUDENT")[];
  activeRole: "TEACHER" | "STUDENT";
  plan?: SubscriptionPlan;
  planExpiry?: string | null;
  aiCredits?: number;
};

/** Legacy tokens only had `role` (singular). */
type LegacySessionPayload = {
  userId: string;
  email: string;
  role: "TEACHER" | "STUDENT";
};

export function normalizeSessionPayload(decoded: unknown): SessionPayload | null {
  if (!decoded || typeof decoded !== "object") return null;
  const o = decoded as Record<string, unknown>;
  const userId = o.userId;
  const email = o.email;
  if (typeof userId !== "string" || typeof email !== "string") return null;

  let plan: SubscriptionPlan | undefined;
  if (o.plan === "BASIC" || o.plan === "PRO" || o.plan === "TOP10") {
    plan = o.plan;
  }

  let planExpiry: string | null | undefined;
  if (o.planExpiry === null) planExpiry = null;
  else if (typeof o.planExpiry === "string") planExpiry = o.planExpiry;

  let aiCredits: number | undefined;
  if (typeof o.aiCredits === "number" && Number.isFinite(o.aiCredits)) {
    aiCredits = o.aiCredits;
  }

  if (Array.isArray(o.roles) && typeof o.activeRole === "string") {
    const roles = o.roles.filter((r): r is "TEACHER" | "STUDENT" => r === "TEACHER" || r === "STUDENT");
    const activeRole = o.activeRole === "TEACHER" || o.activeRole === "STUDENT" ? o.activeRole : null;
    if (activeRole && roles.length > 0 && roles.includes(activeRole)) {
      return {
        userId,
        email,
        roles,
        activeRole,
        plan,
        planExpiry,
        aiCredits,
      };
    }
  }

  const legacy = decoded as Partial<LegacySessionPayload>;
  if (legacy.role === "TEACHER" || legacy.role === "STUDENT") {
    return {
      userId,
      email,
      roles: [legacy.role],
      activeRole: legacy.role,
      plan,
      planExpiry,
      aiCredits,
    };
  }

  return null;
}

export function pickDefaultActiveRole(roles: ("TEACHER" | "STUDENT")[]): "TEACHER" | "STUDENT" {
  if (roles.includes("TEACHER")) return "TEACHER";
  return roles[0] ?? "STUDENT";
}

type SessionUser = {
  id: string;
  email: string;
  roles: readonly ("TEACHER" | "STUDENT")[];
  plan?: SubscriptionPlan;
  planExpiry?: Date | null;
  aiCredits?: number;
};

/** Build JWT payload from DB user; optional `activeRole` must exist in `user.roles`. */
export function toSessionPayload(user: SessionUser, activeRole?: "TEACHER" | "STUDENT"): SessionPayload {
  const roles = [...user.roles] as ("TEACHER" | "STUDENT")[];
  const ar =
    activeRole && roles.includes(activeRole) ? activeRole : pickDefaultActiveRole(roles);
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    roles,
    activeRole: ar,
  };
  if (user.plan) payload.plan = user.plan;
  if (user.planExpiry !== undefined) {
    payload.planExpiry = user.planExpiry ? user.planExpiry.toISOString() : null;
  }
  if (typeof user.aiCredits === "number") payload.aiCredits = user.aiCredits;
  return payload;
}
