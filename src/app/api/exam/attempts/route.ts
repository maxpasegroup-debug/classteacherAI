import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const [legacyAttempts, bankAttempts] = await Promise.all([
    prisma.examAttempt.findMany({
      where: { userId: session.userId, submittedAt: { not: null } },
      orderBy: { startedAt: "desc" },
      take: 30,
      include: { exam: true },
    }),
    prisma.attempt.findMany({
      where: { userId: session.userId, submittedAt: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const legacyRows = legacyAttempts.map((a) => {
    const submittedMs = a.submittedAt ? a.submittedAt.getTime() : a.startedAt.getTime();
    const timeSpentSec = Math.max(0, Math.floor((submittedMs - a.startedAt.getTime()) / 1000));
    const accuracyPct = a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
    return {
      id: a.id,
      engine: "legacy" as const,
      examId: a.examId,
      score: a.score,
      maxScore: a.maxScore,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      exam: a.exam,
      timeSpentSec,
      accuracyPct,
    };
  });

  const bankRows = bankAttempts.map((a) => {
    const submittedMs = a.submittedAt ? a.submittedAt.getTime() : a.createdAt.getTime();
    const timeSpentSec = a.timeTaken > 0 ? a.timeTaken : Math.max(0, Math.floor((submittedMs - a.createdAt.getTime()) / 1000));
    const accuracyPct = a.accuracy > 0 ? a.accuracy : a.total > 0 ? (a.score / a.total) * 100 : 0;
    return {
      id: a.id,
      engine: "bank" as const,
      examId: `bank:${a.exam}:${a.subject}`,
      score: a.score,
      maxScore: a.total,
      startedAt: a.createdAt,
      submittedAt: a.submittedAt,
      exam: {
        id: `bank:${a.id}`,
        title: `${a.exam} · ${a.subject} (${a.mode})`,
        subject: a.subject,
        durationMin: Math.ceil((a.allowedSeconds ?? 0) / 60) || 45,
        type: "MOCK" as const,
      },
      timeSpentSec,
      accuracyPct,
    };
  });

  const attempts = [...legacyRows, ...bankRows].sort(
    (x, y) => new Date(y.startedAt).getTime() - new Date(x.startedAt).getTime(),
  );

  return NextResponse.json({ attempts: attempts.slice(0, 40) });
}
