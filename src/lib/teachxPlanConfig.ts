/** TeachX teacher monetization — separate from student ClassteacherAI `User.plan`. */

export type TeachxPlanKey = "FREE" | "PRO" | "BUSINESS";

export const TEACHX_PLANS = {
  FREE: {
    key: "FREE" as const,
    label: "Free",
    priceInr: 0,
    nexaAccess: false,
    dailyNexaLimit: 0,
    businessAccess: false,
  },
  PRO: {
    key: "PRO" as const,
    label: "Pro",
    priceInr: 199,
    nexaAccess: true,
    /** Max Nexa chat requests per UTC day */
    dailyNexaLimit: 50,
    businessAccess: false,
  },
  BUSINESS: {
    key: "BUSINESS" as const,
    label: "Business",
    priceInr: 999,
    nexaAccess: true,
    dailyNexaLimit: null as null, // unlimited (enforced by high token cap only)
    businessAccess: true,
  },
} as const;

export function isValidTeachxPlanKey(raw: string): raw is TeachxPlanKey {
  return raw === "FREE" || raw === "PRO" || raw === "BUSINESS";
}

export function normalizeTeachxPlan(raw: string | null | undefined): TeachxPlanKey {
  if (raw && isValidTeachxPlanKey(raw)) return raw;
  return "FREE";
}
