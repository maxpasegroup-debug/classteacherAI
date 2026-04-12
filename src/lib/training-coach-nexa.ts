import OpenAI from "openai";
import { assertCanUseAi, deductAiCredits, refundAiCredits } from "@/lib/billing";
import { getOpenAiEnv } from "@/lib/env";
import { isTopRankPlan } from "@/lib/plan-tier";

export type RankCoachPayload = {
  /** What broke down in this attempt (rank lens, not marks comfort). */
  whatWentWrong: string;
  /** Concrete fixes — speed, accuracy, topic drill. */
  whatToFix: string;
  /** One measurable next move; no idle. */
  nextAction: string;
};

function heuristicCoach(input: {
  accuracyPct: number;
  weakTopics: string[];
  subject: string;
  exam: string;
  timeSpentSec: number;
  plan: string;
}): RankCoachPayload {
  const { accuracyPct, weakTopics, subject, exam, timeSpentSec, plan } = input;
  const w = weakTopics.length > 0 ? weakTopics.slice(0, 4).join(", ") : "errors spread — no single leak";
  const rank = accuracyPct < 70 ? "not rank-safe yet" : accuracyPct < 85 ? "borderline for a serious rank goal" : "acceptable for maintenance, not complacency";

  let whatWentWrong: string;
  if (accuracyPct >= 85) {
    whatWentWrong = `Accuracy ${accuracyPct.toFixed(1)}% on ${exam} · ${subject} — ${rank}. If time was loose, you are still leaving rank on the table.`;
  } else if (accuracyPct >= 60) {
    whatWentWrong = `You are bleeding rank through inconsistent execution (${accuracyPct.toFixed(1)}%). Weak band: ${w}.`;
  } else {
    whatWentWrong = `This round would cost you heavily in rank (${accuracyPct.toFixed(1)}%). Foundation and speed on ${w} are not negotiable.`;
  }

  const slowHint =
    timeSpentSec > 45 * 60
      ? " You are too slow overall — cut thinking time per item or skip-and-return discipline."
      : "";

  const whatToFix =
    weakTopics.length > 0
      ? `Stop rotating topics. Lock onto ${weakTopics[0]}: explanations + timed repeats until failure rate drops.${slowHint}`
      : `Run error logging on every miss; re-hit the same concept within 24h with a timer.${slowHint}`;

  const nextAction =
    isTopRankPlan(plan) && weakTopics[0]
      ? `Next: 30 items on ${weakTopics[0]} under exam pressure, then immediate Fix weak areas loop — today.`
      : weakTopics[0]
        ? `Next: 20 timed questions on ${weakTopics[0]}, then one mixed mock same evening.`
        : `Next: one full timed block + written log of every wrong reasoning line.`;

  return { whatWentWrong, whatToFix, nextAction };
}

/**
 * Strict rank-coach debrief (OpenAI when allowed; heuristic fallback).
 */
export async function fetchRankCoachFeedback(input: {
  userId: string;
  plan: string;
  exam: string;
  subject: string;
  accuracyPct: number;
  score: number;
  maxScore: number;
  timeSpentSec: number;
  weakTopicHints: string[];
}): Promise<RankCoachPayload> {
  const topRank = isTopRankPlan(input.plan);
  const canTryAi = topRank || input.plan === "PRO" || input.plan === "ELITE";

  if (!canTryAi) {
    return heuristicCoach({
      accuracyPct: input.accuracyPct,
      weakTopics: input.weakTopicHints,
      subject: input.subject,
      exam: input.exam,
      timeSpentSec: input.timeSpentSec,
      plan: input.plan,
    });
  }

  const gate = await assertCanUseAi(input.userId);
  if (!gate.ok) {
    return heuristicCoach({
      accuracyPct: input.accuracyPct,
      weakTopics: input.weakTopicHints,
      subject: input.subject,
      exam: input.exam,
      timeSpentSec: input.timeSpentSec,
      plan: input.plan,
    });
  }

  let charged = false;
  if (!topRank) {
    charged = await deductAiCredits(input.userId);
    if (!charged) {
      return heuristicCoach({
        accuracyPct: input.accuracyPct,
        weakTopics: input.weakTopicHints,
        subject: input.subject,
        exam: input.exam,
        timeSpentSec: input.timeSpentSec,
        plan: input.plan,
      });
    }
  }

  try {
    const { OPENAI_API_KEY, OPENAI_MODEL } = getOpenAiEnv();
    const client = new OpenAI({ apiKey: OPENAI_API_KEY });
    const strictness = topRank
      ? "You are a ruthless Indian competitive-exam rank coach (NEET/JEE). No empathy padding. Speak in short, commanding sentences. Rank and speed matter — not school marks."
      : "You are a strict rank-focused coach for NEET/JEE. Direct, confident, zero fluff.";

    const userBlock = JSON.stringify({
      instruction: "Analyze this student like a strict rank coach after a timed test.",
      exam: input.exam,
      subject: input.subject,
      accuracyPct: input.accuracyPct,
      score: input.score,
      maxScore: input.maxScore,
      timeSpentSec: input.timeSpentSec,
      weakTopics: input.weakTopicHints,
    });

    const res = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: topRank ? 0.3 : 0.45,
      max_tokens: topRank ? 520 : 360,
      messages: [
        {
          role: "system",
          content: `${strictness} Output ONLY valid JSON with keys "whatWentWrong", "whatToFix", "nextAction" (each a string, no markdown). Example tone: "You are losing rank through slow thinking. We fix this now."`,
        },
        { role: "user", content: userBlock },
      ],
    });

    let text = res.choices[0]?.message?.content?.trim() ?? "";
    const brace = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (brace >= 0 && end > brace) text = text.slice(brace, end + 1);
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const whatWentWrong = typeof parsed.whatWentWrong === "string" ? parsed.whatWentWrong : "";
    const whatToFix = typeof parsed.whatToFix === "string" ? parsed.whatToFix : "";
    const nextAction = typeof parsed.nextAction === "string" ? parsed.nextAction : "";
    if (!whatWentWrong || !whatToFix || !nextAction) {
      throw new Error("Invalid coach JSON");
    }
    return { whatWentWrong, whatToFix, nextAction };
  } catch {
    if (charged) await refundAiCredits(input.userId);
    return heuristicCoach({
      accuracyPct: input.accuracyPct,
      weakTopics: input.weakTopicHints,
      subject: input.subject,
      exam: input.exam,
      timeSpentSec: input.timeSpentSec,
      plan: input.plan,
    });
  }
}
