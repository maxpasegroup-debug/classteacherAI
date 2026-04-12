/** Client → /api/nexa/chat — shapes Nexa “central intelligence” framing (auth stays server-side). */

export type NexaAssistantRole = "STUDENT" | "TEACHER" | "ADMIN";
export type NexaAssistantModule =
  | "dashboard"
  | "lesson"
  | "business"
  | "rootscare"
  | "skills"
  | "admin";

export type NexaContextPayload = {
  role: NexaAssistantRole;
  module: NexaAssistantModule;
  plan?: string;
  recentActivity?: string;
};

const ROLES: NexaAssistantRole[] = ["STUDENT", "TEACHER", "ADMIN"];
const MODULES: NexaAssistantModule[] = [
  "dashboard",
  "lesson",
  "business",
  "rootscare",
  "skills",
  "admin",
];

export function sanitizeNexaContextPayload(raw: unknown): NexaContextPayload | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const role = typeof o.role === "string" ? (o.role.toUpperCase() as NexaAssistantRole) : undefined;
  const module = typeof o.module === "string" ? (o.module.toLowerCase() as NexaAssistantModule) : undefined;
  if (!role || !ROLES.includes(role)) return undefined;
  if (!module || !MODULES.includes(module)) return undefined;
  const plan = typeof o.plan === "string" ? o.plan.trim().slice(0, 64) : undefined;
  const recentActivity =
    typeof o.recentActivity === "string" ? o.recentActivity.trim().slice(0, 600) : undefined;
  return {
    role,
    module,
    ...(plan ? { plan } : {}),
    ...(recentActivity ? { recentActivity } : {}),
  };
}

function modeHint(role: NexaAssistantRole, module: NexaAssistantModule): string {
  if (role === "STUDENT") {
    return "Act as central intelligence: coaching, motivation, weakness-aware nudges, and the next best training action. Keep answers tight unless the user asks for depth.";
  }
  if (role === "TEACHER") {
    if (module === "business") {
      return "Act as business copilot: earnings levers, 1:1 teaching growth, RootsCare / Skills Academy pathways, and crisp decisions — no generic fluff.";
    }
    return "Act as teacher copilot: lesson planning, class suggestions, and productivity — classroom-ready outputs.";
  }
  if (role === "ADMIN") {
    return "Boss panel advisory mode: platform growth, user success, risk flags, and operational improvements — high-level and actionable.";
  }
  return "";
}

/** Appended to system prompt (does not replace persona guardrails). */
export function formatNexaProductContextLine(ctx: NexaContextPayload): string {
  const parts = [
    `Nexa Assistant surface: module="${ctx.module}", declaredRole="${ctx.role}" (UI context only; real account rules still apply).`,
    ctx.plan ? `Plan / tier label: ${ctx.plan}.` : null,
    ctx.recentActivity ? `Recent activity (user-supplied summary): ${ctx.recentActivity}` : null,
    modeHint(ctx.role, ctx.module),
  ].filter(Boolean);
  return parts.join("\n");
}

export const DEFAULT_STUDENT_QUICK_PROMPTS = [
  { label: "Start next test", prompt: "What should I do right now to start my next timed test or mock?" },
  { label: "Improve weak area", prompt: "Based on my goals, what is the single weakest area I should attack today and how?" },
];

export const DEFAULT_TEACHER_QUICK_PROMPTS = [
  { label: "Create lesson", prompt: "Help me outline a 45-minute lesson with objectives, activities, and exit check." },
  { label: "Generate worksheet", prompt: "Draft a printable worksheet with questions and an answer key for my topic." },
];

export const DEFAULT_BUSINESS_QUICK_PROMPTS = [
  { label: "Increase earnings", prompt: "Give me 3 concrete ways to increase my earnings as a TeachX Business teacher this month." },
  { label: "Find students", prompt: "How should I position myself to attract more 1:1 students on ClassteacherAI?" },
];

export const DEFAULT_ADMIN_QUICK_PROMPTS = [
  { label: "User health", prompt: "What signals should I watch to spot at-risk students and teachers this week?" },
  { label: "Growth ideas", prompt: "Suggest three high-leverage growth experiments for the platform." },
];

export function defaultQuickPrompts(
  role: NexaAssistantRole,
  module: NexaAssistantModule,
): { label: string; prompt: string }[] {
  if (role === "ADMIN") return DEFAULT_ADMIN_QUICK_PROMPTS;
  if (role === "STUDENT") return DEFAULT_STUDENT_QUICK_PROMPTS;
  if (module === "business") return DEFAULT_BUSINESS_QUICK_PROMPTS;
  return DEFAULT_TEACHER_QUICK_PROMPTS;
}

/** API `capability` field — must match allowed caps per route. */
export function defaultNexaAssistantCapability(
  role: NexaAssistantRole,
  module: NexaAssistantModule,
): string {
  if (role === "STUDENT" || role === "ADMIN") return "EXAM_TIPS";
  if (module === "business") return "NOTES_GENERATION";
  return "LESSON_PLANNING";
}

/** Sample + data-aware lines for the student home dashboard. */
export function deriveStudentDashboardInsights(
  home: {
    mission?: { progressPct: number; todaySubmitted?: number };
    weakAreas?: string[];
    streak?: { days: number };
  } | null,
  rankProfile?: { weakAreaFocus?: string } | null,
): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];

  if (home?.weakAreas?.length) {
    out.push({
      id: "weak",
      text: `Your recent attempts flag gaps in: ${home.weakAreas.slice(0, 3).join(", ")}. Prioritize short timed sets here.`,
    });
  } else if (rankProfile?.weakAreaFocus) {
    out.push({
      id: "weak-profile",
      text: `Profile focus: ${rankProfile.weakAreaFocus} — align your next exam with that thread.`,
    });
  } else {
    out.push({
      id: "weak-generic",
      text: "Complete another timed attempt so Nexa can pinpoint a concrete weak topic to attack.",
    });
  }

  const pct = home?.mission?.progressPct ?? 0;
  if (pct < 35) {
    out.push({
      id: "consistency",
      text: "Practice consistency looks light this week — one full mock closes the gap faster than scattered notes.",
    });
  } else {
    out.push({
      id: "consistency-ok",
      text: "You’re building momentum — keep chaining attempts with short debriefs between runs.",
    });
  }

  out.push({
    id: "earn",
    text: "You can earn more via focused 1:1 help later — for now, rank moves come from exam volume + accuracy.",
  });

  return out.slice(0, 4);
}
