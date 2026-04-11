import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  assertWithinDailyTokenBudget,
  estimateTokensFromText,
  recordAiTokenUsage,
  STREAM_OUTPUT_RESERVE_TOKENS,
} from "@/lib/ai-cost";
import { getCurrentSession } from "@/lib/auth";
import {
  AI_REQUEST_CREDIT_COST,
  assertCanUseAi,
  deductAiCredits,
  PAID_DAILY_AI_CAP,
  refundAiCredits,
} from "@/lib/billing";
import { getOpenAiEnv } from "@/lib/env";
import { logAi } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Body = {
  kind: "LESSON" | "WORKSHEET" | "QUESTIONS";
  topic: string;
  subject?: string;
  level?: string;
};

function getDayStart() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function promptFor(kind: Body["kind"], topic: string, subject: string, level: string) {
  if (kind === "LESSON") {
    return `Create a concise lesson plan outline for "${topic}" (${subject}, ${level}). Include objectives, activities, and assessment.`;
  }
  if (kind === "WORKSHEET") {
    return `Create a printable worksheet for "${topic}" (${subject}, ${level}) with clear instructions and exercises.`;
  }
  return `Generate 5 multiple-choice questions (with 4 options each, mark the correct answer) on "${topic}" for ${subject} at ${level}.`;
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.kind || !body.topic?.trim()) {
    return NextResponse.json({ error: "kind and topic are required.", code: "VALIDATION" }, { status: 400 });
  }

  const subject = body.subject?.trim() ?? "General";
  const level = body.level?.trim() ?? "Unspecified";

  const gate = await assertCanUseAi(session.userId);
  if (!gate.ok) {
    logAi("generate_blocked", { userId: session.userId, reason: gate.code });
    return NextResponse.json(
      { error: gate.error, code: gate.code },
      { status: gate.code === "CREDITS" ? 402 : 403 },
    );
  }

  const plan = gate.user.plan;
  const day = getDayStart();
  const usageRow = await prisma.usageStat.findUnique({
    where: { userId_day: { userId: session.userId, day } },
  });
  if ((usageRow?.aiRequests ?? 0) >= PAID_DAILY_AI_CAP) {
    return NextResponse.json({ error: "Daily AI usage limit reached.", code: "RATE_LIMIT" }, { status: 429 });
  }

  const systemLine = "You are Nexa AI for ClassteacherAI. Output clear, classroom-ready content.";
  const userLine = promptFor(body.kind, body.topic.trim(), subject, level);
  const estimatedPromptTokens = estimateTokensFromText(`${systemLine}\n${userLine}`);

  const tokenGate = assertWithinDailyTokenBudget({
    plan,
    priorPromptTokens: usageRow?.aiTokensPrompt ?? 0,
    priorCompletionTokens: usageRow?.aiTokensCompletion ?? 0,
    estimatedPromptTokens,
    reservedOutputTokens: STREAM_OUTPUT_RESERVE_TOKENS,
  });
  if (!tokenGate.ok) {
    logAi("generate_token_cap", {
      userId: session.userId,
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

  const deductCredits = gate.tier === "PRO" || gate.tier === "ELITE";

  if (deductCredits) {
    const deducted = await deductAiCredits(session.userId, AI_REQUEST_CREDIT_COST);
    if (!deducted) {
      return NextResponse.json({ error: "Upgrade plan or buy credits", code: "CREDITS" }, { status: 402 });
    }
  }

  await prisma.usageStat.upsert({
    where: { userId_day: { userId: session.userId, day } },
    create: { userId: session.userId, day, aiRequests: 1 },
    update: { aiRequests: { increment: 1 } },
  });

  logAi("generate_request", { userId: session.userId, kind: body.kind });

  const env = getOpenAiEnv();
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  let text: OpenAI.Chat.Completions.ChatCompletion;
  try {
    text = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: systemLine },
        { role: "user", content: userLine },
      ],
    });
  } catch (err) {
    logAi("generate_openai_error", { userId: session.userId, message: err instanceof Error ? err.message : "unknown" });
    await prisma.usageStat.update({
      where: { userId_day: { userId: session.userId, day } },
      data: { aiRequests: { decrement: 1 } },
    });
    if (deductCredits) {
      await refundAiCredits(session.userId, AI_REQUEST_CREDIT_COST);
    }
    return NextResponse.json({ error: "Unable to reach AI provider.", code: "AI_UNAVAILABLE" }, { status: 502 });
  }

  const content = text.choices[0]?.message?.content ?? "";
  const u = text.usage;
  const promptT = u?.prompt_tokens ?? estimatedPromptTokens;
  const completionT = u?.completion_tokens ?? estimateTokensFromText(content);
  await recordAiTokenUsage(session.userId, day, promptT, completionT);

  return NextResponse.json({ content });
}
