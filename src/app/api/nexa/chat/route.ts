import OpenAI from "openai";
import { NextResponse } from "next/server";
import type { NexaCapability, NexaMode, SubscriptionPlan } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import {
  assertWithinDailyTokenBudget,
  estimateTokensFromMessages,
  estimateTokensFromText,
  recordAiTokenUsage,
  STREAM_OUTPUT_RESERVE_TOKENS,
} from "@/lib/ai-cost";
import { prisma } from "@/lib/prisma";
import { getOpenAiEnv } from "@/lib/env";
import {
  AI_REQUEST_CREDIT_COST,
  assertCanUseAi,
  deductAiCredits,
  PAID_DAILY_AI_CAP,
  refundAiCredits,
  TOP10_DAILY_AI_CAP,
  applyPlanExpiry,
} from "@/lib/billing";
import { logAi } from "@/lib/logger";
import { buildProSupportMemoryLine } from "@/lib/nexa-pro-context";
import { buildNexaSystemPrompt, studentPersonaFromPlan } from "@/lib/nexa-personas";
import type { SessionPayload } from "@/lib/session-payload";

export const runtime = "nodejs";

type RequestBody = {
  conversationId?: string;
  content: string;
  mode?: NexaMode;
  capability?: NexaCapability | string;
  className?: string;
  subject?: string;
  level?: string;
};

const TEACHER_CAPABILITIES: NexaCapability[] = ["LESSON_PLANNING", "CONTENT_CREATION", "NOTES_GENERATION"];
const STUDENT_CAPABILITIES: NexaCapability[] = ["DOUBT_SOLVING", "CONCEPT_TEACHING", "EXAM_TIPS", "NOTES_GENERATION"];

function resolveMode(bodyMode: string | undefined, session: SessionPayload): NexaMode {
  const want = bodyMode === "TEACHER" ? "TEACHER" : bodyMode === "STUDENT" ? "STUDENT" : null;
  if (want === "TEACHER" && session.roles.includes("TEACHER")) return "TEACHER";
  if (want === "STUDENT" && session.roles.includes("STUDENT")) return "STUDENT";
  return session.activeRole;
}

function normalizeCapability(mode: NexaMode, raw: string | undefined): NexaCapability {
  const allowed = mode === "TEACHER" ? TEACHER_CAPABILITIES : STUDENT_CAPABILITIES;
  if (raw && (allowed as string[]).includes(raw)) return raw as NexaCapability;
  return mode === "TEACHER" ? "LESSON_PLANNING" : "DOUBT_SOLVING";
}

const capabilityGuide: Record<NexaCapability, string> = {
  LESSON_PLANNING:
    "Task: Lesson planning. Produce clear learning objectives, timing, activities, differentiation, materials, and formative assessment. Align with the stated subject and level.",
  DOUBT_SOLVING:
    "Task: Doubt solving. Diagnose misconceptions, explain step-by-step, use simple language, and check understanding with a short follow-up question.",
  NOTES_GENERATION:
    "Task: Notes / structured output. Use headings, bullets, key terms, and quick recap; match the reader's role (student vs teacher) as implied by mode.",
  CONCEPT_TEACHING:
    "Task: Concept teaching. Build from intuition to formal idea, use analogies, examples, and a mini practice check; adapt depth to the student's level.",
  EXAM_TIPS:
    "Task: Exam tips. Give revision strategy, time management, common pitfalls, and quick drills—prioritize what helps in tests for their level and subject.",
  CONTENT_CREATION:
    "Task: Content creation. Produce classroom-ready materials: prompts, items, rubrics, or handouts; keep tone professional and reusable.",
};

function getDayStart() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body.", code: "BAD_REQUEST" }, { status: 400 });
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Message content is required.", code: "VALIDATION" }, { status: 400 });
  }

  const mode = resolveMode(body.mode, session);
  const capability = normalizeCapability(mode, body.capability);

  await applyPlanExpiry(session.userId);
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      subscriptionExpiry: true,
      credits: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found.", code: "NOT_FOUND" }, { status: 404 });
  }

  if (user.subscriptionStatus !== "ACTIVE" || !user.subscriptionExpiry || user.subscriptionExpiry < new Date()) {
    logAi("nexa_blocked", { userId: session.userId, reason: "EXPIRED" });
    return NextResponse.json(
      { error: "Your plan period has ended. Renew to use Nexa.", code: "EXPIRED" },
      { status: 403 },
    );
  }

  const plan = user.plan as SubscriptionPlan;

  if (mode === "STUDENT" && plan === "BASIC") {
    logAi("nexa_blocked", { userId: session.userId, reason: "BASIC_STUDENT" });
    return NextResponse.json(
      { error: "Nexa AI is not available on Starter. Upgrade to Pro or TopRank.", code: "PLAN" },
      { status: 403 },
    );
  }

  const day = getDayStart();
  const usageRow = await prisma.usageStat.findUnique({
    where: { userId_day: { userId: session.userId, day } },
  });
  const priorRequests = usageRow?.aiRequests ?? 0;
  const priorPrompt = usageRow?.aiTokensPrompt ?? 0;
  const priorCompletion = usageRow?.aiTokensCompletion ?? 0;

  let deductCredits = false;
  let dailyCap = PAID_DAILY_AI_CAP;

  if (mode === "TEACHER") {
    if (plan === "BASIC") {
      logAi("nexa_blocked", { userId: session.userId, reason: "BASIC_TEACHER" });
      return NextResponse.json(
        { error: "Nexa AI is not available on Starter for teachers. Upgrade to Pro or TopRank.", code: "PLAN" },
        { status: 403 },
      );
    }
    const gate = await assertCanUseAi(session.userId);
    if (!gate.ok) {
      logAi("nexa_blocked", { userId: session.userId, reason: gate.code });
      return NextResponse.json(
        { error: gate.error, code: gate.code },
        { status: gate.code === "CREDITS" ? 402 : 403 },
      );
    }
    if (gate.tier === "TOP10") {
      dailyCap = TOP10_DAILY_AI_CAP;
      deductCredits = false;
    } else {
      deductCredits = true;
    }
  } else {
    if (plan === "PRO") {
      const gate = await assertCanUseAi(session.userId);
      if (!gate.ok) {
        logAi("nexa_blocked", { userId: session.userId, reason: gate.code });
        return NextResponse.json(
          { error: gate.error, code: gate.code },
          { status: gate.code === "CREDITS" ? 402 : 403 },
        );
      }
      deductCredits = true;
    } else if (plan === "TOP10") {
      dailyCap = TOP10_DAILY_AI_CAP;
      deductCredits = false;
    } else {
      return NextResponse.json({ error: "Invalid plan for Nexa.", code: "PLAN" }, { status: 403 });
    }
  }

  if (priorRequests >= dailyCap) {
    logAi("nexa_daily_cap", { userId: session.userId });
    return NextResponse.json({ error: "Daily AI usage limit reached.", code: "RATE_LIMIT" }, { status: 429 });
  }

  const userRow = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      nexaStudentLevel: true,
      nexaStudentSubject: true,
      nexaTeacherSubject: true,
    },
  });

  const trainerMem =
    mode === "STUDENT" && plan === "TOP10"
      ? await prisma.nexaStudentMemory.findUnique({ where: { userId: session.userId } })
      : null;

  const trainerMemoryLine =
    mode === "STUDENT" && plan === "TOP10"
      ? trainerMem
        ? `TopRank performance file (mandatory; quote rank readiness as ${trainerMem.rankReadiness}/100): Weak topics to attack: ${trainerMem.weakTopics.length ? trainerMem.weakTopics.slice(0, 8).join("; ") : "none logged yet"}. Exams logged: ${trainerMem.examCount}. Last exam accuracy: ${trainerMem.lastAccuracyPct != null ? `${trainerMem.lastAccuracyPct.toFixed(1)}%` : "n/a"}. If accuracy is low or weak topics are many, use strict language (e.g. not ready / retry / speed issue).`
        : "Performance file empty — no exam memory yet. Tell them to complete a timed attempt now; no casual coaching until there is data."
      : undefined;

  const proSupportMemoryLine =
    mode === "STUDENT" && plan === "PRO" ? await buildProSupportMemoryLine(session.userId) : undefined;

  const subjectForPrompt =
    mode === "STUDENT"
      ? (body.subject?.trim() || userRow?.nexaStudentSubject || "General")
      : (body.subject?.trim() || userRow?.nexaTeacherSubject || "General");

  const levelForPrompt = body.level?.trim() || userRow?.nexaStudentLevel || "Not specified";
  const className = body.className?.trim() || "—";

  let conversation = body.conversationId
    ? await prisma.conversation.findFirst({
        where: { id: body.conversationId, userId: session.userId },
      })
    : null;

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        userId: session.userId,
        title: `${subjectForPrompt}: ${body.content.slice(0, 52)}`,
        mode,
        capability,
      },
    });
  } else if (conversation.mode !== mode || conversation.capability !== capability) {
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: { mode, capability },
    });
  }

  await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content: body.content.trim(),
    },
  });

  const otherChats = await prisma.conversation.findMany({
    where: { userId: session.userId, id: { not: conversation.id } },
    orderBy: { updatedAt: "desc" },
    take: 6,
    select: { title: true, updatedAt: true, mode: true, capability: true },
  });

  const chatTopicsLine =
    otherChats.length === 0
      ? "Other recent chats: none yet."
      : `Other recent chat topics (titles): ${otherChats
          .map((c) => `${c.title} (${c.mode}/${c.capability})`)
          .join("; ")}.`;

  const history = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 35,
  });
  history.reverse();

  const subjectLine =
    mode === "STUDENT"
      ? `Context — subject: ${subjectForPrompt}; level/grade: ${levelForPrompt}; class/section: ${className}. Tailor explanations to this level.`
      : `Context — teaching subject: ${subjectForPrompt}; class/section: ${className}. Tailor materials for educators.`;

  const systemContent = buildNexaSystemPrompt({
    mode,
    capability,
    capabilityGuide,
    activeRole: session.activeRole,
    userName: userRow?.name ?? "User",
    subjectLine,
    chatTopicsLine,
    studentPersona: studentPersonaFromPlan(plan),
    trainerMemoryLine,
    proSupportMemoryLine,
  });

  const messagesForOpenAi: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...history.map((msg) => ({
      role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    })),
  ];

  const estimatedPromptTokens = estimateTokensFromMessages(
    messagesForOpenAi.map((m) => ({ content: typeof m.content === "string" ? m.content : "" })),
  );

  if (plan === "PRO" || plan === "TOP10") {
    const tokenGate = assertWithinDailyTokenBudget({
      plan,
      priorPromptTokens: priorPrompt,
      priorCompletionTokens: priorCompletion,
      estimatedPromptTokens,
      reservedOutputTokens: STREAM_OUTPUT_RESERVE_TOKENS,
    });
    if (!tokenGate.ok) {
      logAi("nexa_token_cap", {
        userId: session.userId,
        plan,
        reason: tokenGate.reason,
        projected: tokenGate.reason === "TOKEN_DAILY_CAP" ? tokenGate.projectedTotal : undefined,
      });
      const status = tokenGate.reason === "NO_AI" ? 403 : 429;
      return NextResponse.json(
        {
          error:
            tokenGate.reason === "TOKEN_DAILY_CAP"
              ? "Daily AI token limit reached. Try again tomorrow or contact support."
              : "AI is not available on this plan.",
          code: tokenGate.reason === "TOKEN_DAILY_CAP" ? "TOKEN_LIMIT" : "PLAN",
        },
        { status },
      );
    }
  }

  if (deductCredits) {
    const deducted = await deductAiCredits(session.userId, AI_REQUEST_CREDIT_COST);
    if (!deducted) {
      logAi("nexa_deduct_failed", { userId: session.userId });
      return NextResponse.json({ error: "Upgrade plan or buy credits", code: "CREDITS" }, { status: 402 });
    }
  }

  await prisma.usageStat.upsert({
    where: { userId_day: { userId: session.userId, day } },
    create: { userId: session.userId, day, aiRequests: 1 },
    update: { aiRequests: { increment: 1 } },
  });

  logAi("nexa_request", {
    userId: session.userId,
    capability,
    mode,
    plan,
    persona: mode === "STUDENT" ? studentPersonaFromPlan(plan) : "teacher",
  });

  const env = getOpenAiEnv();
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
  try {
    stream = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      stream: true,
      stream_options: { include_usage: true },
      messages: messagesForOpenAi,
    });
  } catch (err) {
    logAi("nexa_openai_init_error", { userId: session.userId, message: err instanceof Error ? err.message : "unknown" });
    await prisma.usageStat.update({
      where: { userId_day: { userId: session.userId, day } },
      data: { aiRequests: { decrement: 1 } },
    });
    if (deductCredits) {
      await refundAiCredits(session.userId, AI_REQUEST_CREDIT_COST);
    }
    return NextResponse.json({ error: "Unable to reach AI provider.", code: "AI_UNAVAILABLE" }, { status: 502 });
  }

  const encoder = new TextEncoder();
  let assistantText = "";
  const userId = session.userId;

  const readable = new ReadableStream({
    async start(controller) {
      let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
      try {
        for await (const chunk of stream) {
          if (chunk.usage) {
            usage = chunk.usage;
          }
          const token = chunk.choices[0]?.delta?.content ?? "";
          if (!token) continue;
          assistantText += token;
          controller.enqueue(encoder.encode(token));
        }

        await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            role: "ASSISTANT",
            content: assistantText || "I am ready to help. Please try again.",
          },
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });

        const promptT = usage?.prompt_tokens ?? estimatedPromptTokens;
        let completionT = usage?.completion_tokens ?? estimateTokensFromText(assistantText);
        if (!usage && promptT + completionT < 1) {
          completionT = Math.max(1, completionT);
        }
        await recordAiTokenUsage(userId, day, promptT, completionT);
      } catch (err) {
        logAi("nexa_stream_error", { userId, message: err instanceof Error ? err.message : "unknown" });
        await prisma.usageStat.update({
          where: { userId_day: { userId, day } },
          data: { aiRequests: { decrement: 1 } },
        });
        if (deductCredits) {
          await refundAiCredits(userId, AI_REQUEST_CREDIT_COST);
        }
        const partial = estimateTokensFromText(assistantText);
        if (partial > 0 || estimatedPromptTokens > 0) {
          await recordAiTokenUsage(userId, day, estimatedPromptTokens, partial);
        }
        controller.enqueue(encoder.encode("\n\nSorry, I ran into an issue. Your credit was refunded. Please retry."));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Conversation-Id": conversation.id,
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
