import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveStudentPlan, requireStudentFeature } from "@/lib/student-access";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const active = await requireActiveStudentPlan(session.userId);
  if (!active.ok) {
    return NextResponse.json({ error: active.error, code: active.code }, { status: 403 });
  }
  const progress = await prisma.courseProgress.findMany({ where: { userId: session.userId }, include: { course: true } });
  return NextResponse.json({ progress });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const gate = await requireStudentFeature(session.userId, "skills_progress_write");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error, code: gate.code }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as { courseId?: string; progressPct?: number } | null;
  if (!body?.courseId || typeof body.progressPct !== "number") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const updated = await prisma.courseProgress.upsert({
    where: { courseId_userId: { courseId: body.courseId, userId: session.userId } },
    create: { courseId: body.courseId, userId: session.userId, progressPct: body.progressPct },
    update: { progressPct: body.progressPct },
  });
  if (updated.progressPct >= 100) {
    await prisma.certificate.upsert({
      where: { userId_courseId: { userId: session.userId, courseId: body.courseId } },
      create: { userId: session.userId, courseId: body.courseId },
      update: {},
    }).catch(() => undefined);
  }
  return NextResponse.json({ ok: true, updated });
}
