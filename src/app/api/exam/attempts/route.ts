import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const attempts = await prisma.examAttempt.findMany({
    where: { userId: session.userId, submittedAt: { not: null } },
    orderBy: { startedAt: "desc" },
    take: 30,
    include: { exam: true },
  });

  return NextResponse.json({
    attempts: attempts.map((a) => {
      const submittedMs = a.submittedAt ? a.submittedAt.getTime() : a.startedAt.getTime();
      const timeSpentSec = Math.max(0, Math.floor((submittedMs - a.startedAt.getTime()) / 1000));
      const accuracyPct = a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
      return {
        id: a.id,
        examId: a.examId,
        score: a.score,
        maxScore: a.maxScore,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        exam: a.exam,
        timeSpentSec,
        accuracyPct,
      };
    }),
  });
}
