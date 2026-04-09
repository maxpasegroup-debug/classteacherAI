import { prisma } from "@/lib/prisma";

function topicKey(subject: string, level: string) {
  const safe = level.replace(/\|/g, "/").trim();
  return `${subject.trim()}|${safe}`;
}

function topicLabel(subject: string, level: string) {
  return `${subject.trim()} — ${level.trim()}`;
}

function utcDayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function computeConsistencyScoreFromAccuracies(accs: number[]): number | null {
  if (accs.length < 2) return null;
  const mean = accs.reduce((a, b) => a + b, 0) / accs.length;
  const variance = accs.reduce((s, x) => s + (x - mean) ** 2, 0) / accs.length;
  const std = Math.sqrt(variance);
  return Math.round((100 * (1 - Math.min(1, std / 35))) * 10) / 10;
}

function consistencyFromAccuracies(accs: number[]): number | null {
  return computeConsistencyScoreFromAccuracies(accs);
}

async function rankReadinessForUser(userId: string): Promise<number> {
  const mem = await prisma.nexaStudentMemory.findUnique({ where: { userId }, select: { rankReadiness: true } });
  if (mem) return mem.rankReadiness;
  const recent = await prisma.examAttempt.findMany({
    where: { userId, submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
    take: 5,
    select: { score: true, maxScore: true },
  });
  if (recent.length === 0) return 50;
  return Math.round(
    recent.reduce((s, a) => s + (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0), 0) / recent.length,
  );
}

export type RecordAttemptMetricsInput = {
  userId: string;
  attemptId: string;
  examId: string;
  subject: string;
  accuracyPct: number;
  timeSpentSec: number;
  questionIds: string[];
  wrongIds: string[];
};

/**
 * Persists attempt-level metrics, topic mastery, daily snapshot, and insight rows.
 * Idempotent per attemptId. Safe to call from exam submit; errors should not fail submit.
 */
export async function recordPerformanceAttemptMetrics(input: RecordAttemptMetricsInput): Promise<void> {
  const { userId, attemptId, examId, subject, accuracyPct, timeSpentSec, questionIds, wrongIds } = input;

  const dup = await prisma.performanceAttemptMetric.findUnique({ where: { attemptId }, select: { id: true } });
  if (dup) return;

  const wrongSet = new Set(wrongIds);
  const questions = await prisma.questionBank.findMany({ where: { id: { in: questionIds } } });
  const qMap = new Map(questions.map((q) => [q.id, q]));

  const questionCount = questionIds.length;
  const secondsPerQuestion = questionCount > 0 ? timeSpentSec / questionCount : 0;

  const wrongByTopic: Record<string, number> = {};
  const totalsByTopic = new Map<string, { total: number; wrong: number; label: string }>();

  for (const qid of questionIds) {
    const q = qMap.get(qid);
    if (!q) continue;
    const key = topicKey(subject, q.level);
    const label = topicLabel(subject, q.level);
    const cur = totalsByTopic.get(key) ?? { total: 0, wrong: 0, label };
    cur.total += 1;
    if (wrongSet.has(qid)) cur.wrong += 1;
    cur.label = label;
    totalsByTopic.set(key, cur);
    if (wrongSet.has(qid)) {
      wrongByTopic[key] = (wrongByTopic[key] ?? 0) + 1;
    }
  }

  const rr = await rankReadinessForUser(userId);

  await prisma.$transaction(async (tx) => {
    await tx.performanceAttemptMetric.create({
      data: {
        attemptId,
        userId,
        examId,
        subject,
        accuracyPct,
        timeSpentSec,
        questionCount,
        secondsPerQuestion,
        wrongByTopic,
        rankReadinessSnapshot: rr,
      },
    });

    for (const [topicKeyVal, row] of totalsByTopic) {
      await tx.performanceTopicStat.upsert({
        where: { userId_topicKey: { userId, topicKey: topicKeyVal } },
        create: {
          userId,
          topicKey: topicKeyVal,
          subject,
          label: row.label,
          answered: row.total,
          correct: row.total - row.wrong,
        },
        update: {
          label: row.label,
          answered: { increment: row.total },
          correct: { increment: row.total - row.wrong },
        },
      });
    }
  });

  const submittedAt = new Date();
  const dayKey = utcDayKey(submittedAt);

  const snap = await prisma.performanceDailySnapshot.findUnique({
    where: { userId_dayKey: { userId, dayKey } },
  });

  const newCount = (snap?.attemptCount ?? 0) + 1;
  const newAvgAcc = snap ? (snap.avgAccuracy * snap.attemptCount + accuracyPct) / newCount : accuracyPct;
  const newAvgSpq = snap
    ? (snap.avgSecondsPerQuestion * snap.attemptCount + secondsPerQuestion) / newCount
    : secondsPerQuestion;

  const dayMetrics = await prisma.performanceAttemptMetric.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(`${dayKey}T00:00:00.000Z`),
        lte: new Date(`${dayKey}T23:59:59.999Z`),
      },
    },
    select: { accuracyPct: true },
  });
  const accs = dayMetrics.map((m) => m.accuracyPct);
  const dayConsistency = consistencyFromAccuracies(accs);

  await prisma.performanceDailySnapshot.upsert({
    where: { userId_dayKey: { userId, dayKey } },
    create: {
      userId,
      dayKey,
      avgAccuracy: newAvgAcc,
      attemptCount: newCount,
      avgSecondsPerQuestion: newAvgSpq,
      consistencyScore: dayConsistency,
    },
    update: {
      avgAccuracy: newAvgAcc,
      attemptCount: newCount,
      avgSecondsPerQuestion: newAvgSpq,
      consistencyScore: dayConsistency,
    },
  });

  const messages = await buildInsightMessages(userId);
  const recentMsgs = await prisma.performanceInsightRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { message: true },
  });
  const seen = new Set(recentMsgs.map((r) => r.message));
  const fresh = messages.filter((m) => !seen.has(m.message));
  if (fresh.length > 0) {
    await prisma.performanceInsightRecord.createMany({
      data: fresh.map((m) => ({
        userId,
        message: m.message,
        kind: m.kind,
        relatedSubject: m.relatedSubject ?? null,
        relatedTopic: m.relatedTopic ?? null,
      })),
    });

    const excess = await prisma.performanceInsightRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      skip: 60,
      select: { id: true },
    });
    if (excess.length > 0) {
      await prisma.performanceInsightRecord.deleteMany({ where: { id: { in: excess.map((e) => e.id) } } });
    }
  }
}

type InsightMsg = { message: string; kind: string; relatedSubject?: string; relatedTopic?: string };

async function buildInsightMessages(userId: string): Promise<InsightMsg[]> {
  const out: InsightMsg[] = [];

  const metrics = await prisma.performanceAttemptMetric.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { subject: true, accuracyPct: true, createdAt: true },
  });

  if (metrics.length === 0) return out;

  const bySubject = new Map<string, typeof metrics>();
  for (const m of metrics) {
    const arr = bySubject.get(m.subject) ?? [];
    arr.push(m);
    bySubject.set(m.subject, arr);
  }

  for (const [sub, rows] of bySubject) {
    if (rows.length < 6) continue;
    const sorted = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const n = sorted.length;
    const prev3 = sorted.slice(Math.max(0, n - 6), Math.max(0, n - 3));
    const last3 = sorted.slice(Math.max(0, n - 3));
    if (prev3.length < 3 || last3.length < 3) continue;
    const prevAvg = prev3.reduce((s, x) => s + x.accuracyPct, 0) / 3;
    const lastAvg = last3.reduce((s, x) => s + x.accuracyPct, 0) / 3;
    const delta = lastAvg - prevAvg;
    if (delta >= 3) {
      out.push({
        message: `You improved about ${delta.toFixed(0)}% in ${sub} (last 3 attempts vs the 3 before).`,
        kind: "improvement",
        relatedSubject: sub,
      });
    }
  }

  const topics = await prisma.performanceTopicStat.findMany({
    where: { userId, answered: { gte: 3 } },
    orderBy: { answered: "desc" },
  });

  const weakest = [...topics]
    .map((t) => ({
      ...t,
      mastery: t.answered > 0 ? (t.correct / t.answered) * 100 : 0,
    }))
    .sort((a, b) => a.mastery - b.mastery)[0];

  if (weakest && weakest.mastery < 72) {
    out.push({
      message: `Focus on ${weakest.label} — mastery is about ${weakest.mastery.toFixed(0)}% across your attempts.`,
      kind: "focus",
      relatedSubject: weakest.subject,
      relatedTopic: weakest.label,
    });
  }

  const last7 = metrics.filter((m) => {
    const t = Date.now() - m.createdAt.getTime();
    return t <= 7 * 24 * 60 * 60 * 1000;
  });
  const prev7 = metrics.filter((m) => {
    const t = Date.now() - m.createdAt.getTime();
    return t > 7 * 24 * 60 * 60 * 1000 && t <= 14 * 24 * 60 * 60 * 1000;
  });
  if (last7.length >= 2 && prev7.length >= 2) {
    const a = last7.reduce((s, x) => s + x.accuracyPct, 0) / last7.length;
    const b = prev7.reduce((s, x) => s + x.accuracyPct, 0) / prev7.length;
    const d = a - b;
    if (Math.abs(d) >= 2) {
      out.push({
        message:
          d > 0
            ? `Daily trend: your recent attempts average ${d.toFixed(1)} points higher than the week before.`
            : `Recent accuracy dipped about ${Math.abs(d).toFixed(1)} points vs the prior week — tighten one weak topic at a time.`,
        kind: "milestone",
      });
    }
  }

  return out.slice(0, 6);
}
