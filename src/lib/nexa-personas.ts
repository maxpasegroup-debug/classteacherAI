import type { NexaCapability, NexaMode } from "@prisma/client";

export type StudentNexaPersona = "basic" | "pro" | "top10_trainer";

export function studentPersonaFromPlan(plan: string): StudentNexaPersona {
  if (plan === "TOP10") return "top10_trainer";
  if (plan === "PRO") return "pro";
  return "basic";
}

const TOP10_TRAINER_CORE = [
  "You are the TOP10 AI Trainer for ClassteacherAI — not a casual chatbot.",
  "Behavior: strict, goal-oriented, zero filler. No greetings like 'Great question!', no emoji, no pep talks.",
  "Every reply must advance a concrete outcome: diagnose error, assign drill, or state the next measurable step.",
  "Preferred phrasing when relevant: 'You need improvement in…', 'Repeat this section now', 'Your rank readiness is… (use the number from performance memory when provided)'.",
  "If the student drifts off-topic, redirect in one sentence to the active goal.",
  "Keep answers tight; use bullets when listing actions.",
].join("\n");

const PRO_STUDENT_CORE = [
  "You are Nexa AI for ClassteacherAI in Student Mode.",
  "Tone: balanced, supportive, clear. Answer helpfully without being preachy.",
  "Prioritize clarity, step-by-step learning, and exam readiness.",
].join("\n");

const BASIC_STUDENT_CORE = [
  "You are Nexa on a limited Basic plan.",
  "Reply in at most 3 short sentences unless the user explicitly asks for more.",
  "No small talk, no long explanations. One concept per reply.",
].join("\n");

const TEACHER_CORE = [
  "You are Nexa AI for ClassteacherAI in Teacher Mode.",
  "Tone: professional, practical, classroom-focused. Prioritize pedagogy and reusable materials.",
].join("\n");

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
      ? TOP10_TRAINER_CORE
      : studentPersona === "pro"
        ? PRO_STUDENT_CORE
        : BASIC_STUDENT_CORE;

  const memoryBlock =
    studentPersona === "top10_trainer" && params.trainerMemoryLine
      ? `\n${params.trainerMemoryLine}\n`
      : "";

  const roleHint =
    activeRole !== mode
      ? ` Note: The user's active dashboard role is ${activeRole} but they chose ${mode} mode—stay consistent with ${mode} mode.`
      : "";

  return [
    personaBlock + roleHint + memoryBlock,
    capabilityGuide[capability],
    `Learner display name: ${userName}.`,
    subjectLine,
    chatTopicsLine,
    "Use prior messages in this thread as memory. Reference earlier details when helpful.",
    studentPersona === "top10_trainer"
      ? "End with a single explicit next action when possible."
      : "Keep responses actionable and concise unless the user asks for depth.",
  ].join("\n");
}
