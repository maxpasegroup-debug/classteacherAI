import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveStudentPlan, requireStudentFeature } from "@/lib/student-access";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const active = await requireActiveStudentPlan(session.userId);
  if (!active.ok) {
    return NextResponse.json({ error: active.error, code: active.code }, { status: 403 });
  }

  const requests = await prisma.studentHelpRequest.findMany({
    where: { studentId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      matchedTeacher: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const gate = await requireStudentFeature(session.userId, "study_help");
  if (!gate.ok) {
    const status =
      gate.code === "EXPIRED" || gate.code === "SUBSCRIPTION" ? 403 : gate.code === "PLAN" ? 403 : 400;
    return NextResponse.json({ error: gate.error, code: gate.code }, { status });
  }

  const body = (await request.json().catch(() => null)) as {
    topic?: string;
    subject?: string;
    teacherId?: string;
  } | null;

  if (!body?.topic?.trim()) {
    return NextResponse.json({ error: "topic is required.", code: "VALIDATION" }, { status: 400 });
  }

  const matchedTeacherId: string | null = body.teacherId ?? null;
  if (matchedTeacherId) {
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: matchedTeacherId },
    });
    if (!profile) {
      return NextResponse.json({ error: "Teacher not found.", code: "NOT_FOUND" }, { status: 404 });
    }
  }

  const created = await prisma.studentHelpRequest.create({
    data: {
      studentId: session.userId,
      topic: body.topic.trim(),
      subject: body.subject?.trim() || null,
      matchedTeacherId,
      status: matchedTeacherId ? "MATCHED" : "OPEN",
    },
  });

  return NextResponse.json({ request: created });
}
