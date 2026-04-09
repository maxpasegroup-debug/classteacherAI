import { prisma } from "@/lib/prisma";
import { PASS_THRESHOLD_PCT } from "@/lib/top10-training-engine";

export type TrainerDebrief = {
  mistakeAnalysis: string;
  weakTopics: string[];
  nextAction: string;
  rankReadiness: number;
};

/**
 * Updates Nexa performance memory and returns a strict trainer debrief for TOP10 students.
 */
export async function updateNexaStudentMemoryAfterExam(
  userId: string,
  input: {
    examId: string;
    subject: string;
    accuracyPct: number;
    wrongIds: string[];
  },
): Promise<TrainerDebrief> {
  const { examId, subject, accuracyPct, wrongIds } = input;

  const mistakeAnalysis =
    wrongIds.length === 0
      ? "No misses on this attempt — lock the habit: same speed, zero careless slips on the next block."
      : `You need improvement in ${subject}: ${wrongIds.length} item(s) missed. Trace each wrong option against the correct rule before you continue.`;

  const weakTopics =
    wrongIds.length > 0 ? [`${subject} (${wrongIds.length} missed)`] : [`${subject} — accuracy held`];

  const nextAction =
    accuracyPct < PASS_THRESHOLD_PCT
      ? "Repeat this section now — same topic cluster until you clear the standard."
      : "Your rank readiness is trending — schedule the next timed set while the pattern is fresh; rotate weak topics daily.";

  const recent = await prisma.examAttempt.findMany({
    where: { userId, submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
    take: 5,
    select: { score: true, maxScore: true },
  });

  const rankReadiness =
    recent.length === 0
      ? Math.round(accuracyPct)
      : Math.round(
          recent.reduce((s, a) => s + (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0), 0) / recent.length,
        );

  const existing = await prisma.nexaStudentMemory.findUnique({ where: { userId } });
  const mergedWeak = [...new Set([...(existing?.weakTopics ?? []), ...weakTopics])].slice(0, 10);

  const historyArr = Array.isArray(existing?.history) ? ([...(existing.history as object[])] as object[]) : [];
  historyArr.unshift({
    at: new Date().toISOString(),
    examId,
    accuracyPct,
    wrongCount: wrongIds.length,
    subject,
  });
  const history = historyArr.slice(0, 5);

  await prisma.nexaStudentMemory.upsert({
    where: { userId },
    create: {
      userId,
      weakTopics: mergedWeak,
      rankReadiness,
      examCount: 1,
      lastAccuracyPct: accuracyPct,
      lastExamAt: new Date(),
      history,
    },
    update: {
      weakTopics: mergedWeak,
      rankReadiness,
      examCount: { increment: 1 },
      lastAccuracyPct: accuracyPct,
      lastExamAt: new Date(),
      history,
    },
  });

  return {
    mistakeAnalysis,
    weakTopics,
    nextAction,
    rankReadiness,
  };
}
