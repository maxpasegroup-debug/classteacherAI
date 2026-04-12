import OpenAI from "openai";
import type { NexaCapability, NexaMode } from "@prisma/client";
import {
  assertWithinTeachxTokenBudget,
  estimateTokensFromMessages,
  estimateTokensFromText,
  recordAiTokenUsage,
  STREAM_OUTPUT_RESERVE_TOKENS,
} from "@/lib/ai-cost";
import { prisma } from "@/lib/prisma";
import { getOpenAiEnv } from "@/lib/env";
import { logAi } from "@/lib/logger";
import { buildNexaSystemPrompt, studentPersonaFromPlan } from "@/lib/nexa-personas";
import { formatNexaProductContextLine, sanitizeNexaContextPayload } from "@/lib/nexa-assistant-context";
import { checkTeachxNexaRequest } from "@/lib/teachxAccess";
import type { SessionPayload } from "@/lib/session-payload";

const TEACHER_CAPS: NexaCapability[] = ["LESSON_PLANNING", "CONTENT_CREATION", "NOTES_GENERATION"];

export function normalizeTeacherNexaCapability(raw: string | undefined): NexaCapability {
  if (raw && (TEACHER_CAPS as string[]).includes(raw)) return raw as NexaCapability;
  return "LESSON_PLANNING";
}

type TeacherChatBody = {
  conversationId?: string;
  content: string;
  capability?: NexaCapability | string;
  className?: string;
  subject?: string;
  level?: string;
  nexaContext?: unknown;
};

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
    "Task: Rank / exam conditioning. Pacing, skip strategy, trap patterns, weak-topic locks, and the next timed mock they must run — rank outcome first.",
  CONTENT_CREATION:
    "Task: Content creation. Produce classroom-ready materials: prompts, items, rubrics, or handouts; keep tone professional and reusable.",
};

type TeacherUser = {
  name: string | null;
  teachxPlan: string;
  nexaStudentLevel: string | null;
  nexaStudentSubject: string | null;
};

export async function runTeacherNexaChat(params: {
  session: SessionPayload;
  body: TeacherChatBody;
  user: TeacherUser;
  day: Date;
  priorRequests: number;
  priorPrompt: number;
  priorCompletion: number;
}): Promise<Response> {
  const { session, body, user, day, priorRequests, priorPrompt, priorCompletion } = params;

  const gate = checkTeachxNexaRequest({
    teachxPlan: user.teachxPlan,
    requestsToday: priorRequests,
  });
  if (!gate.ok) {
    logAi("teachx_nexa_blocked", { userId: session.userId, code: gate.code });
    return jsonUpgrade(gate.message, gate.code);
  }

  const mode: NexaMode = "TEACHER";
  const capability = normalizeTeacherNexaCapability(body.capability);

  const subjectForPrompt = body.subject?.trim() || user.nexaStudentSubject || "General";
  const levelForPrompt = body.level?.trim() || user.nexaStudentLevel || "Not specified";
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

  const subjectLine = `Context — subject: ${subjectForPrompt}; level/grade: ${levelForPrompt}; class/section: ${className}. Tailor outputs to this context.`;

  const nexaCtx = sanitizeNexaContextPayload(body.nexaContext);
  const productContextLine = nexaCtx ? formatNexaProductContextLine(nexaCtx) : undefined;

  const systemContent = buildNexaSystemPrompt({
    mode,
    capability,
    capabilityGuide,
    activeRole: "TEACHER",
    userName: user.name ?? "Educator",
    subjectLine,
    chatTopicsLine,
    studentPersona: studentPersonaFromPlan("BASIC"),
    productContextLine,
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

  const tokenGate = assertWithinTeachxTokenBudget({
    teachxPlan: user.teachxPlan,
    priorPromptTokens: priorPrompt,
    priorCompletionTokens: priorCompletion,
    estimatedPromptTokens,
    reservedOutputTokens: STREAM_OUTPUT_RESERVE_TOKENS,
  });
  if (!tokenGate.ok) {
    logAi("teachx_nexa_token_cap", { userId: session.userId, reason: tokenGate.reason });
    const status = tokenGate.reason === "NO_AI" ? 403 : 429;
    const msg =
      tokenGate.reason === "TOKEN_DAILY_CAP"
        ? "Daily AI limit reached. Upgrade to Business for higher limits."
        : "Nexa is not available on your TeachX plan.";
    return jsonUpgrade(msg, tokenGate.reason === "TOKEN_DAILY_CAP" ? "TOKEN_LIMIT" : "PLAN", status);
  }

  await prisma.usageStat.upsert({
    where: { userId_day: { userId: session.userId, day } },
    create: { userId: session.userId, day, aiRequests: 1 },
    update: { aiRequests: { increment: 1 } },
  });

  logAi("teachx_nexa_request", { userId: session.userId, capability, teachxPlan: user.teachxPlan });

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
    return new Response(JSON.stringify({ error: "Unable to reach AI provider.", code: "AI_UNAVAILABLE" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
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
        const partial = estimateTokensFromText(assistantText);
        if (partial > 0 || estimatedPromptTokens > 0) {
          await recordAiTokenUsage(userId, day, estimatedPromptTokens, partial);
        }
        controller.enqueue(encoder.encode("\n\nSorry, I ran into an issue. Please retry."));
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

function jsonUpgrade(message: string, code: string, status = 403): Response {
  return new Response(
    JSON.stringify({
      success: false,
      upgradeRequired: true,
      message,
      error: message,
      code,
    }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}
