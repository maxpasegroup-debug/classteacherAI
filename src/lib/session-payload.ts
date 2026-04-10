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
  subscriptionExpiry?: string | null;
  credits?: number;
  onboardingCompleted?: boolean;
};

/** Legacy tokens only had `role` (singular). */
type LegacySessionPayload = {
  userId: string;
  email: string;
  role: "TEACHER" | "STUDENT";
};

function readSubscriptionExpiry(o: Record<string, unknown>): string | null | undefined {
  if (o.subscriptionExpiry === null) return null;
  if (typeof o.subscriptionExpiry === "string") return o.subscriptionExpiry;
  if (o.planExpiry === null) return null;
  if (typeof o.planExpiry === "string") return o.planExpiry;
  return undefined;
}

function readCredits(o: Record<string, unknown>): number | undefined {
  if (typeof o.credits === "number" && Number.isFinite(o.credits)) return o.credits;
  if (typeof o.aiCredits === "number" && Number.isFinite(o.aiCredits)) return o.aiCredits;
  return undefined;
}

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

  const subscriptionExpiry = readSubscriptionExpiry(o);
  const credits = readCredits(o);

  let onboardingCompleted: boolean | undefined;
  if (typeof o.onboardingCompleted === "boolean") {
    onboardingCompleted = o.onboardingCompleted;
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
        subscriptionExpiry,
        credits,
        onboardingCompleted,
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
      subscriptionExpiry,
      credits,
      onboardingCompleted,
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
  subscriptionExpiry?: Date | null;
  credits?: number;
  studentProfile?: { onboardingCompleted: boolean } | null;
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
  if (user.subscriptionExpiry !== undefined) {
    payload.subscriptionExpiry = user.subscriptionExpiry ? user.subscriptionExpiry.toISOString() : null;
  }
  if (typeof user.credits === "number") payload.credits = user.credits;
  if (typeof user.studentProfile?.onboardingCompleted === "boolean") {
    payload.onboardingCompleted = user.studentProfile.onboardingCompleted;
  }
  return payload;
}
