import { TEACHX_PLANS, type TeachxPlanKey, normalizeTeachxPlan } from "@/lib/teachxPlanConfig";

export type TeachxFeature = "nexa" | "businessDashboard";

export type TeachxUserFields = {
  role: string;
  teachxPlan: string;
};

export type TeachxAccessDenied = {
  ok: false;
  code: string;
  message: string;
  upgradeRequired: true;
};

export type TeachxAccessOk = { ok: true };

export type TeachxAccessResult = TeachxAccessOk | TeachxAccessDenied;

function denied(code: string, message: string): TeachxAccessDenied {
  return { ok: false, code, message, upgradeRequired: true };
}

/** Feature gates for teacher accounts only. */
export function checkTeachxAccess(user: TeachxUserFields, feature: TeachxFeature): TeachxAccessResult {
  if (user.role !== "TEACHER") {
    return { ok: true };
  }

  const plan = normalizeTeachxPlan(user.teachxPlan);
  const cfg = TEACHX_PLANS[plan];

  if (feature === "businessDashboard") {
    if (!cfg.businessAccess) {
      return denied("PLAN", "Upgrade to Business to unlock the business dashboard and earning modules.");
    }
    return { ok: true };
  }

  if (feature === "nexa") {
    if (!cfg.nexaAccess) {
      return denied("PLAN", "Upgrade to unlock Nexa intelligence.");
    }
    return { ok: true };
  }

  return denied("PLAN", "Upgrade to continue.");
}

export type TeachxNexaGateInput = {
  teachxPlan: string;
  /** Nexa requests already counted today (UTC day), e.g. from UsageStat.aiRequests */
  requestsToday: number;
};

/** Nexa-specific: plan + daily count (PRO daily cap). */
export function checkTeachxNexaRequest(input: TeachxNexaGateInput): TeachxAccessResult {
  const plan = normalizeTeachxPlan(input.teachxPlan);
  const cfg = TEACHX_PLANS[plan];

  if (!cfg.nexaAccess) {
    return denied("PLAN", "Upgrade to unlock Nexa intelligence.");
  }

  if (plan === "PRO" && typeof cfg.dailyNexaLimit === "number") {
    if (input.requestsToday >= cfg.dailyNexaLimit) {
      return denied(
        "RATE_LIMIT",
        "Daily Nexa limit reached on Pro. Upgrade to Business for full Nexa access.",
      );
    }
  }

  return { ok: true };
}

export function teachxPlanFromKey(key: TeachxPlanKey): string {
  return key;
}
