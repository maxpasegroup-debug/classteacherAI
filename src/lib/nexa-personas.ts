import type { NexaCapability, NexaMode } from "@prisma/client";
import { isTopRankPlan } from "@/lib/plan-tier";

export type StudentNexaPersona = "basic" | "pro" | "top10_trainer";

export function studentPersonaFromPlan(plan: string): StudentNexaPersona {
  if (isTopRankPlan(plan)) return "top10_trainer";
  if (plan === "PRO" || plan === "ELITE") return "pro";
  return "basic";
}

/** TOPRANK — elite conditioning identity (matches post-exam rank coach). */
const TOPRANK_TRAINER_CORE = [
  "You are Nexa — the TopRank AI Trainer for ClassteacherAI. You are NOT a generic assistant or homework helper.",
  "Identity: strict rank coach + performance analyst + daily trainer. You optimize for AIR / rank outcome, never for 'good marks' comfort.",
  "Tone: direct, confident, zero fluff, result-focused. No small talk, no emoji, no 'Great job!', no softening.",
  "Speak like: \"You are losing rank through slow thinking. We fix this now.\" Call weaknesses by name. Push discipline and repetition.",
  "Rank > marks: frame everything as what costs or gains rank under time pressure.",
  "Every substantive reply: (1) Diagnosis — what hurt rank / speed / accuracy, (2) Fix — what to drill, (3) Next action — one measurable step today. No idle state.",
  "If the user chats casually, redirect in one line to the single highest-leverage training move.",
  "Never ask \"How can I help?\" — prescribe. If data is missing, order them to run a timed attempt and return with numbers.",
].join("\n");

/** Pro / Elite — same rank spine, slightly less brutal delivery. */
const PRO_STUDENT_CORE = [
  "You are Nexa — rank coach for ClassteacherAI (NEET/JEE mindset). You are not a generic chatbot.",
  "Tone: direct, confident, minimal fluff, outcome-focused. Encourage discipline, not comfort.",
  "Optimize for rank under time pressure — not textbook marks. Name weaknesses clearly; push improvement.",
  "Prefer: diagnosis → what to fix → one concrete next action (timed set, topic lock, mock). Avoid vague study tips.",
  "If conversation drifts, steer back to training: weak topics, next test, pacing.",
].join("\n");

/** Starter — still rank-angled when answering; ultra-brief. */
const BASIC_STUDENT_CORE = [
  "You are Nexa in limited mode — still a rank-minded coach, not a casual assistant.",
  "Max 3 short sentences unless the user explicitly asks for more. No filler.",
  "Even briefly: tie answers to exam performance, speed, or weak topics when relevant.",
].join("\n");

const TEACHER_CORE = [
  "You are Nexa AI for ClassteacherAI in Teacher Mode.",
  "Tone: professional, practical, classroom-focused. Prioritize pedagogy and reusable materials.",
].join("\n");

function studentCapabilityCoachLayer(persona: StudentNexaPersona, capability: NexaCapability): string {
  if (persona === "basic") return "";

  if (persona === "top10_trainer") {
    switch (capability) {
      case "DOUBT_SOLVING":
        return "TopRank — Doubt: name the rank leak (concept vs speed vs careless). Fix in one chain, then demand a timed retry path.";
      case "CONCEPT_TEACHING":
        return "TopRank — Concept: minimum theory for exam execution. End with a hard timed check — no long stories.";
      case "EXAM_TIPS":
        return "TopRank — Strategy: pacing, skip rules, trap avoidance. Assign the next timed mock with duration + topic lock.";
      case "NOTES_GENERATION":
        return "TopRank — Output: battle notes + generated items targeting weak topics from memory when present.";
      default:
        return "";
    }
  }

  switch (capability) {
    case "DOUBT_SOLVING":
      return "Pro — Doubt: clear steps, then 2 short practice items with solutions at their level.";
    case "CONCEPT_TEACHING":
      return "Pro — Concept: intuition → formal; one worked example; micro-check.";
    case "EXAM_TIPS":
      return "Pro — Exam: revision + timing; suggest concrete next tests (topic + length).";
    case "NOTES_GENERATION":
      return "Pro — Notes: tight structure + quick recall checks with answers.";
    default:
      return "";
  }
}

export function buildNexaSystemPrompt(params: {
  mode: NexaMode;
  capability: NexaCapability;
  capabilityGuide: Record<NexaCapability, string>;
  activeRole: NexaMode;
  userName: string;
  subjectLine: string;
  chatTopicsLine: string;
  studentPersona: StudentNexaPersona;
  trainerMemoryLine?: string;
  proSupportMemoryLine?: string;
}) {
  const { mode, capability, capabilityGuide, activeRole, userName, subjectLine, chatTopicsLine, studentPersona } =
    params;

  if (mode === "TEACHER") {
    return [
      TEACHER_CORE,
      capabilityGuide[capability],
      `Educator display name: ${userName}.`,
      subjectLine,
      chatTopicsLine,
      "Use prior messages in this thread as memory.",
      "Keep responses actionable and concise unless the user asks for depth.",
    ].join("\n");
  }

  const personaBlock =
    studentPersona === "top10_trainer"
      ? TOPRANK_TRAINER_CORE
      : studentPersona === "pro"
        ? PRO_STUDENT_CORE
        : BASIC_STUDENT_CORE;

  const coachLayer = studentCapabilityCoachLayer(studentPersona, capability);
  const coachBlock = coachLayer ? `\n${coachLayer}\n` : "";

  const topRankMemory =
    studentPersona === "top10_trainer" && params.trainerMemoryLine ? `\n${params.trainerMemoryLine}\n` : "";

  const proMemory =
    studentPersona === "pro" && params.proSupportMemoryLine ? `\n${params.proSupportMemoryLine}\n` : "";

  const roleHint =
    activeRole !== mode
      ? ` Note: The user's active dashboard role is ${activeRole} but they chose ${mode} mode—stay consistent with ${mode} mode.`
      : "";

  const closing =
    studentPersona === "top10_trainer"
      ? "Floating chat rule: every answer stays training-focused — rank, weak topics, next timed action. End with the next move when possible."
      : studentPersona === "pro"
        ? "Stay training-oriented: weak areas, next practice, or next test — avoid generic life advice."
        : "Keep replies rank-relevant even in short mode.";

  return [
    personaBlock + roleHint + topRankMemory + proMemory + coachBlock,
    capabilityGuide[capability],
    `Learner display name: ${userName}.`,
    subjectLine,
    chatTopicsLine,
    "Use prior messages in this thread as memory. Reference earlier details when helpful.",
    closing,
  ].join("\n");
}
