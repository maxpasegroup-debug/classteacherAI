import { prisma } from "@/lib/prisma";
import { isTopRankPlan } from "@/lib/plan-tier";

/** Rough tokenizer: ~4 chars per token for English-ish text (conservative for budgeting). */
export const ESTIMATED_CHARS_PER_TOKEN = 4;

/** Reserve for model output before a streamed request (fail-safe pre-check). */
export const STREAM_OUTPUT_RESERVE_TOKENS = 12_000;

/** PRO / ELITE: hard daily token ceiling (prompt + completion), UTC day — paired with credits. */
export const PRO_DAILY_TOKEN_CAP = 250_000;

/** TopRank: high allowance but bounded to prevent runaway cost. */
export const TOPRANK_DAILY_TOKEN_CAP = 2_000_000;

/** @deprecated use TOPRANK_DAILY_TOKEN_CAP */
export const TOP10_DAILY_TOKEN_CAP = TOPRANK_DAILY_TOKEN_CAP;

export function estimateTokensFromText(text: string): number {
  if (!text.length) return 0;
  return Math.max(1, Math.ceil(text.length / ESTIMATED_CHARS_PER_TOKEN));
}

export function estimateTokensFromMessages(messages: { content: string }[]): number {
  return messages.reduce((sum, m) => sum + estimateTokensFromText(m.content), 0);
}

export function dailyTokenCapForPlan(plan: string): number {
  if (plan === "PRO" || plan === "ELITE") return PRO_DAILY_TOKEN_CAP;
  if (isTopRankPlan(plan)) return TOPRANK_DAILY_TOKEN_CAP;
  return 0;
}

export type TokenBudgetFailure =
  | { ok: false; reason: "NO_AI"; cap: number }
  | { ok: false; reason: "TOKEN_DAILY_CAP"; cap: number; projectedTotal: number };

/**
 * Fail-safe: block the request if today's usage + this request (prompt estimate + output reserve)
 * would exceed the plan's daily token cap. BASIC has no AI tokens (cap 0).
 */
export function assertWithinDailyTokenBudget(params: {
  plan: string;
  priorPromptTokens: number;
  priorCompletionTokens: number;
  estimatedPromptTokens: number;
  reservedOutputTokens: number;
}): { ok: true } | TokenBudgetFailure {
  const cap = dailyTokenCapForPlan(params.plan);
  if (cap <= 0) {
    return { ok: false, reason: "NO_AI", cap: 0 };
  }
  const prior = params.priorPromptTokens + params.priorCompletionTokens;
  const projected = prior + params.estimatedPromptTokens + params.reservedOutputTokens;
  if (projected > cap) {
    return { ok: false, reason: "TOKEN_DAILY_CAP", cap, projectedTotal: projected };
  }
  return { ok: true };
}

export async function recordAiTokenUsage(
  userId: string,
  day: Date,
  promptTokens: number,
  completionTokens: number,
): Promise<void> {
  const p = Math.max(0, Math.floor(promptTokens));
  const c = Math.max(0, Math.floor(completionTokens));
  if (p === 0 && c === 0) return;
  await prisma.usageStat.update({
    where: { userId_day: { userId, day } },
    data: {
      aiTokensPrompt: { increment: p },
      aiTokensCompletion: { increment: c },
    },
  });
}
