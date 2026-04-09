import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      plan: true,
      nexaStudentLevel: true,
      nexaStudentSubject: true,
      nexaTeacherSubject: true,
      aiCredits: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const trainerMemory =
    user.plan === "TOP10"
      ? await prisma.nexaStudentMemory.findUnique({
          where: { userId: session.userId },
          select: {
            rankReadiness: true,
            weakTopics: true,
            examCount: true,
            lastAccuracyPct: true,
            lastExamAt: true,
          },
        })
      : null;

  return NextResponse.json({
    activeRole: session.activeRole,
    plan: user.plan,
    aiCredits: user.aiCredits,
    credits: user.aiCredits,
    nexaStudentLevel: user.nexaStudentLevel,
    nexaStudentSubject: user.nexaStudentSubject,
    nexaTeacherSubject: user.nexaTeacherSubject,
    trainerMemory,
    nexaPersona: user.plan === "TOP10" ? "top10_trainer" : user.plan === "PRO" ? "pro" : "basic",
  });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    nexaStudentLevel?: string | null;
    nexaStudentSubject?: string | null;
    nexaTeacherSubject?: string | null;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const data: {
    nexaStudentLevel?: string | null;
    nexaStudentSubject?: string | null;
    nexaTeacherSubject?: string | null;
  } = {};

  if ("nexaStudentLevel" in body) {
    data.nexaStudentLevel = body.nexaStudentLevel?.trim() || null;
  }
  if ("nexaStudentSubject" in body) {
    data.nexaStudentSubject = body.nexaStudentSubject?.trim() || null;
  }
  if ("nexaTeacherSubject" in body) {
    data.nexaTeacherSubject = body.nexaTeacherSubject?.trim() || null;
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: {
      nexaStudentLevel: true,
      nexaStudentSubject: true,
      nexaTeacherSubject: true,
      aiCredits: true,
    },
  });

  return NextResponse.json({
    aiCredits: updated.aiCredits,
    credits: updated.aiCredits,
    nexaStudentLevel: updated.nexaStudentLevel,
    nexaStudentSubject: updated.nexaStudentSubject,
    nexaTeacherSubject: updated.nexaTeacherSubject,
  });
}
