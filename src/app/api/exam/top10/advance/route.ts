import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireStudentFeature } from "@/lib/student-access";
import { analysisCopy, practiceCopy } from "@/lib/top10-training-engine";

export const runtime = "nodejs";

type Action = "from_result" | "from_analysis" | "from_practice";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const gate = await requireStudentFeature(session.userId, "top10_training");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error, code: gate.code }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { action?: Action } | null;
  const action = body?.action;
  if (action !== "from_result" && action !== "from_analysis" && action !== "from_practice") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const state = await prisma.top10TrainingState.findUnique({ where: { userId: session.userId } });
  if (!state) {
    return NextResponse.json({ error: "No training state. Complete a TOP10 round first." }, { status: 404 });
  }

  if (state.pendingRetry) {
    return NextResponse.json(
      { error: "Retry required â€” analysis is locked until you pass the round.", code: "RETRY_LOCK" },
      { status: 409 },
    );
  }

  if (action === "from_result") {
    await prisma.top10TrainingState.update({
      where: { userId: session.userId },
      data: { phase: "ANALYSIS" },
    });
    const lines = analysisCopy(state.weakTopics, state.lastAccuracyPct ?? 0, state.difficulty);
    return NextResponse.json({ phase: "ANALYSIS", lines });
  }

  if (action === "from_analysis") {
    await prisma.top10TrainingState.update({
      where: { userId: session.userId },
      data: { phase: "PRACTICE" },
    });
    const lines = practiceCopy(state.weakTopics);
    return NextResponse.json({ phase: "PRACTICE", lines });
  }

  await prisma.top10TrainingState.update({
    where: { userId: session.userId },
    data: { phase: "EXAM" },
  });
  return NextResponse.json({ phase: "EXAM", readyToStart: true });
}
