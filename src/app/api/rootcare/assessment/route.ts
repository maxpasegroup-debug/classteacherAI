import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { answers?: Record<string, number> } | null;
  if (!body?.answers) return NextResponse.json({ error: "answers required." }, { status: 400 });
  const values = Object.values(body.answers);
  const score = values.length ? (values.reduce((a, b) => a + b, 0) / (values.length * 5)) * 100 : 0;
  const attempt = await prisma.assessmentAttempt.create({
    data: { userId: session.userId, answers: body.answers, score },
  });
  return NextResponse.json({ ok: true, attemptId: attempt.id, score });
}
