import { prisma } from "@/lib/prisma";

/**
 * One-line context for Pro "supportive coach" mode from recent topic stats (no AI call).
 */
export async function buildProSupportMemoryLine(userId: string): Promise<string | undefined> {
  const stats = await prisma.performanceTopicStat.findMany({
    where: { userId, answered: { gte: 2 } },
    orderBy: { updatedAt: "desc" },
    take: 24,
  });
  if (stats.length === 0) return undefined;

  const weak = stats
    .map((t) => ({
      label: t.label || t.topicKey,
      pct: t.answered > 0 ? (t.correct / t.answered) * 100 : 100,
    }))
    .filter((x) => x.pct < 72)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 4);

  if (weak.length === 0) return undefined;

  const names = weak.map((w) => `${w.label} (~${Math.round(w.pct)}% right)`).join("; ");
  return `Coach notes from recent practice (weak signals): ${names}. Encourage, then give clear steps and short practice.`;
}
