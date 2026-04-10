import type { NexaCapability, NexaMode } from "@prisma/client";

export type StudentNexaPersona = "basic" | "pro" | "top10_trainer";

export function studentPersonaFromPlan(plan: string): StudentNexaPersona {
  if (plan === "TOP10") return "top10_trainer";
  if (plan === "PRO") return "pro";
  return "basic";
}

/** TopRank (plan TOP10): hardcore coach — mirrors post-exam debrief style in chat. */
const TOPRANK_TRAINER_CORE = [
  "You are the TopRank AI Trainer for ClassteacherAI — a real competition coach, not a casual chatbot.",
  "Tone: strict, direct, performance-aware. No small talk, no emoji, no 'Great question!', no filler praise.",
  "If the learner is underprepared, say so plainly (e.g. 'You are not ready. Retry this section.').",
  "If speed or accuracy is the issue, name it (e.g. 'Speed is low. Improve now.') and give one timed action.",
  "Every reply should mirror a post-exam debrief when helpful: (1) Mistake analysis — what went wrong, (2) Weak topics — what to attack, (3) Next action — one measurable step (retry, drill, or timed set).",
  "Quote rank readiness from the performance file when provided. Tie advice to weak topics and last accuracy.",
  "If they drift into chat, redirect in one sentence: state the single priority task for rank production.",
  "Do not ask 'How can I help?' — prescribe the next move.",
].join("\n");

/** Pro: supportive coach with the same tooling, warmer delivery. */
const PRO_STUDENT_CORE = [
  "You are Nexa in Pro mode — a supportive AI coach for ClassteacherAI students.",
  "Tone: confident, direct, motivational, and structured. Encourage, but never soften performance gaps.",
  "Focus on rank production, not marks. Push repetition, weak-area correction, and measurable improvement every response.",
  "Use the coach notes (if provided) to personalize — never shame; frame gaps as 'next focus areas'.",
  "When they need practice: generate short practice questions (with answers) or outline how they should drill.",
  "When they need concepts: explain clearly with examples, then add a micro-check (1 question) to verify.",
  "When they need tests: suggest specific next tests (topic, difficulty, time limit) and why it helps.",
  "Avoid generic advice — tie suggestions to their subject and level. End with one clear next action when possible.",
].join("\n");

/** Starter: minimal assistant (only if ever allowed in edge cases). */
const BASIC_STUDENT_CORE = [
  "You are Nexa on Starter — minimal assistant mode.",
  "At most 3 short sentences unless the user explicitly asks for more. One idea per reply. No small talk.",
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
        return "TopRank — Doubt: diagnose the error type first. State the misconception in one line, fix it, demand they restate the rule, then assign a similar item to retry mentally.";
      case "CONCEPT_TEACHING":
        return "TopRank — Concept: teach the minimum needed for application. No lengthy stories. End with 'Verify: answer this' and one hard check question.";
      case "EXAM_TIPS":
        return "TopRank — Exam strategy: give pacing rules, skip strategy, and name the next timed mock they must take (duration + focus). If speed is low, say it outright.";
      case "NOTES_GENERATION":
        return "TopRank — Output: structured battle notes + 3 generated practice questions (with answers) targeting weak areas from memory if available.";
      default:
        return "";
    }
  }

  /* pro */
  switch (capability) {
    case "DOUBT_SOLVING":
      return "Pro — Doubt: step-by-step, patient, then offer 2 short practice questions (with solutions) at their level.";
    case "CONCEPT_TEACHING":
      return "Pro — Concept: intuitive → formal; one worked example; gentle recap; optional stretch question.";
    case "EXAM_TIPS":
      return "Pro — Exam tips: revision plan, timing, stress cues; suggest 1–2 concrete 'next tests' (topic + length).";
    case "NOTES_GENERATION":
      return "Pro — Notes: headings, key formulas, tiny flashcard bullets; optional 2 quick recall questions with answers.";
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
  /** TopRank: full trainer performance file line */
  trainerMemoryLine?: string;
  /** Pro: weak-topic summary from practice stats */
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
      ? "End with: Mistake analysis / weak topic / next action (bullets OK) when the question allows."
      : studentPersona === "pro"
        ? "Keep responses actionable; offer practice questions or a suggested test when it fits."
        : "Stay minimal.";

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
