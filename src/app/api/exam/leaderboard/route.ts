import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId");
  if (!examId) return NextResponse.json({ error: "examId required." }, { status: 400 });

  const attempts = await prisma.examAttempt.findMany({
    where: { examId, submittedAt: { not: null } },
    orderBy: [{ score: "desc" }, { submittedAt: "asc" }],
    take: 20,
    include: { user: { select: { name: true } } },
  });

  let rank = 0;
  let prevScore = Number.NaN;
  let prevTime = Number.NaN;
  return NextResponse.json({
    leaderboard: attempts.map((a, i) => {
      const submittedMs = a.submittedAt ? a.submittedAt.getTime() : a.startedAt.getTime();
      const timeSpentSec = Math.max(0, Math.floor((submittedMs - a.startedAt.getTime()) / 1000));
      const accuracyPct = a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
      if (a.score !== prevScore || timeSpentSec !== prevTime) {
        rank = i + 1;
        prevScore = a.score;
        prevTime = timeSpentSec;
      }
      return {
        rank,
        name: a.user.name,
        score: a.score,
        maxScore: a.maxScore,
        accuracyPct,
        timeSpentSec,
      };
    }),
  });
}
