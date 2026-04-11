import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTopRankPlan } from "@/lib/plan-tier";
import { studentPersonaFromPlan } from "@/lib/nexa-personas";

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
      credits: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const trainerMemory = isTopRankPlan(user.plan)
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

  const persona = studentPersonaFromPlan(user.plan);

  return NextResponse.json({
    plan: user.plan,
    credits: user.credits,
    nexaStudentLevel: user.nexaStudentLevel,
    nexaStudentSubject: user.nexaStudentSubject,
    trainerMemory,
    nexaPersona: persona,
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
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const data: {
    nexaStudentLevel?: string | null;
    nexaStudentSubject?: string | null;
  } = {};

  if ("nexaStudentLevel" in body) {
    data.nexaStudentLevel = body.nexaStudentLevel?.trim() || null;
  }
  if ("nexaStudentSubject" in body) {
    data.nexaStudentSubject = body.nexaStudentSubject?.trim() || null;
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: {
      nexaStudentLevel: true,
      nexaStudentSubject: true,
      credits: true,
    },
  });

  return NextResponse.json({
    credits: updated.credits,
    nexaStudentLevel: updated.nexaStudentLevel,
    nexaStudentSubject: updated.nexaStudentSubject,
  });
}
