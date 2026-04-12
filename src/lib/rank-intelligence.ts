import { prisma } from "@/lib/prisma";

export type PerformanceAnalysisJson = {
  weakTopics: string[];
  speedIssues: string[];
  accuracyProblems: string[];
};

const SPQ_SLOW_RATIO = 1.35;

function clampPct(n: number) {
  return Math.max(0, Math.min(100, n));
}

/**
 * Rule-based post-exam signals for dashboard / UI (no LLM).
 */
export function buildPerformanceAnalysis(input: {
  subject: string;
  accuracyPct: number;
  timeSpentSec: number;
  questionCount: number;
  expectedSecondsTotal: number | null;
  isTimeExceeded: boolean;
  weakAreaLines: string[];
}): PerformanceAnalysisJson {
  const weakTopics = [...input.weakAreaLines];
  const speedIssues: string[] = [];
  const accuracyProblems: string[] = [];

  if (input.isTimeExceeded) {
    speedIssues.push("Timer exceeded — practice skipping low-value items and hard stops per section.");
  } else if (input.questionCount > 0 && input.expectedSecondsTotal != null && input.expectedSecondsTotal > 0) {
    const spq = input.timeSpentSec / input.questionCount;
    const targetSpq = input.expectedSecondsTotal / input.questionCount;
    if (targetSpq > 0 && spq > targetSpq * SPQ_SLOW_RATIO) {
      speedIssues.push(
        `Pace is slower than suggested (${spq.toFixed(0)}s vs ~${targetSpq.toFixed(0)}s per item on average).`,
      );
    }
  }

  if (input.accuracyPct < 45) {
    accuracyProblems.push(`${input.subject}: accuracy is critically low — fundamentals or careless errors — drill core items.`);
  } else if (input.accuracyPct < 62) {
    accuracyProblems.push(`${input.subject}: accuracy below a safe mock band — tighten revision before the next full paper.`);
  } else if (input.accuracyPct < 72) {
    accuracyProblems.push(`${input.subject}: close to a stable band — one focused weak-topic set usually lifts this.`);
  }

  return { weakTopics, speedIssues, accuracyProblems };
}

function rankFromPeerMap(bestByUser: Map<string, number>, userId: string): { rank: number; percentile: number; poolSize: number } {
  const myBest = bestByUser.get(userId) ?? 0;
  const poolSize = bestByUser.size;
  const strictlyBetter = [...bestByUser.values()].filter((acc) => acc > myBest + 1e-3).length;
  const rank = strictlyBetter + 1;
  const below = [...bestByUser.entries()].filter(([uid, acc]) => uid !== userId && acc < myBest - 1e-3).length;
  const others = poolSize - 1;
  const percentile = others <= 0 ? 100 : clampPct((below / others) * 100);
  return { rank, percentile, poolSize };
}

/** Peer standing on catalog exams (ExamAttempt). */
export async function computeLegacyExamPeerStats(examId: string, userId: string, myAccuracy: number) {
  const attempts = await prisma.examAttempt.findMany({
    where: { examId, submittedAt: { not: null } },
    select: { userId: true, score: true, maxScore: true },
  });
  const bestByUser = new Map<string, number>();
  for (const a of attempts) {
    const acc = a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
    const prev = bestByUser.get(a.userId) ?? -1;
    if (acc > prev) bestByUser.set(a.userId, acc);
  }
  bestByUser.set(userId, Math.max(bestByUser.get(userId) ?? 0, myAccuracy));
  return rankFromPeerMap(bestByUser, userId);
}

/** Peer standing on structured bank attempts (Attempt). */
export async function computeBankPeerStats(exam: string, subject: string, userId: string, myAccuracy: number) {
  const rows = await prisma.attempt.findMany({
    where: { exam, subject, submittedAt: { not: null } },
    select: { userId: true, accuracy: true },
  });
  const bestByUser = new Map<string, number>();
  for (const r of rows) {
    const prev = bestByUser.get(r.userId) ?? -1;
    if (r.accuracy > prev) bestByUser.set(r.userId, r.accuracy);
  }
  bestByUser.set(userId, Math.max(bestByUser.get(userId) ?? 0, myAccuracy));
  return rankFromPeerMap(bestByUser, userId);
}

export type RecordStudentPerformanceInput = {
  studentId: string;
  /** Stored reference: catalog `Exam.id` or `bank:{track}:{subject}`. */
  examId: string;
  attemptId: string;
  subject: string;
  score: number;
  accuracy: number;
  timeTaken: number;
  analysis: PerformanceAnalysisJson;
  weakAreas: string[];
  peer: { kind: "legacy"; catalogExamId: string } | { kind: "bank"; exam: string; subject: string };
};

/**
 * Persists one row per attempt (idempotent). Computes rank vs peers on same exam key.
 * Errors are swallowed by caller if needed.
 */
export async function recordStudentPerformanceSnapshot(input: RecordStudentPerformanceInput): Promise<void> {
  const { studentId, examId, attemptId, subject, score, accuracy, timeTaken, analysis, weakAreas, peer } = input;

  let rank: number;
  let percentile: number;

  if (peer.kind === "bank") {
    const p = await computeBankPeerStats(peer.exam, peer.subject, studentId, accuracy);
    rank = p.rank;
    percentile = p.percentile;
  } else {
    const p = await computeLegacyExamPeerStats(peer.catalogExamId, studentId, accuracy);
    rank = p.rank;
    percentile = p.percentile;
  }

  await prisma.studentPerformance.upsert({
    where: { attemptId },
    create: {
      studentId,
      examId,
      attemptId,
      subject,
      score,
      accuracy,
      timeTaken,
      rank,
      percentile,
      analysis: analysis as object,
      weakAreas,
    },
    update: {
      examId,
      subject,
      score,
      accuracy,
      timeTaken,
      rank,
      percentile,
      analysis: analysis as object,
      weakAreas,
    },
  });
}

export async function getPerformanceIntelligence(userId: string) {
  const [snapshots, top10, user] = await Promise.all([
    prisma.studentPerformance.findMany({
      where: { studentId: userId, attemptId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        examId: true,
        subject: true,
        score: true,
        accuracy: true,
        timeTaken: true,
        rank: true,
        percentile: true,
        analysis: true,
        weakAreas: true,
        createdAt: true,
      },
    }),
    prisma.top10TrainingState.findUnique({
      where: { userId },
      select: {
        difficulty: true,
        pendingRetry: true,
        weakTopics: true,
        lastAccuracyPct: true,
        streakPasses: true,
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
  ]);

  const latest = snapshots[0] ?? null;
  const plan = user?.plan ?? "BASIC";

  return {
    latestSnapshot: latest,
    snapshots: snapshots.map((s) => ({
      id: s.id,
      examId: s.examId,
      subject: s.subject,
      score: s.score,
      accuracy: s.accuracy ?? s.score,
      timeTaken: s.timeTaken,
      rank: s.rank,
      percentile: s.percentile,
      analysis: s.analysis as PerformanceAnalysisJson,
      weakAreas: s.weakAreas,
      createdAt: s.createdAt.toISOString(),
    })),
    topRankLoop:
      plan === "TOPRANK"
        ? {
            active: true,
            difficulty: top10?.difficulty ?? 2,
            pendingRetry: top10?.pendingRetry ?? false,
            weakTopics: top10?.weakTopics ?? [],
            lastAccuracyPct: top10?.lastAccuracyPct ?? null,
            streakPasses: top10?.streakPasses ?? 0,
            hints: [
              top10?.pendingRetry ? "Mandatory retry before advancing the loop." : null,
              (top10?.difficulty ?? 2) >= 3 ? "High difficulty tier — expect fewer gimmies." : null,
            ].filter(Boolean) as string[],
          }
        : { active: false as const },
  };
}
