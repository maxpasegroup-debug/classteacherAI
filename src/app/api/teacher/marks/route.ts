import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const teacherStudentId = searchParams.get("teacherStudentId");
  if (!teacherStudentId) {
    return NextResponse.json({ error: "teacherStudentId required.", code: "VALIDATION" }, { status: 400 });
  }

  const student = await prisma.teacherStudent.findFirst({
    where: { id: teacherStudentId, teacherId: session.userId },
  });
  if (!student) {
    return NextResponse.json({ error: "Not found.", code: "NOT_FOUND" }, { status: 404 });
  }

  const marks = await prisma.markEntry.findMany({
    where: { teacherStudentId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ marks });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    teacherStudentId?: string;
    subject?: string;
    title?: string;
    score?: number;
    maxScore?: number;
    term?: string;
  } | null;

  if (!body?.teacherStudentId || !body.subject?.trim() || typeof body.score !== "number" || typeof body.maxScore !== "number") {
    return NextResponse.json({ error: "Invalid payload.", code: "VALIDATION" }, { status: 400 });
  }

  const student = await prisma.teacherStudent.findFirst({
    where: { id: body.teacherStudentId, teacherId: session.userId },
  });
  if (!student) {
    return NextResponse.json({ error: "Not found.", code: "NOT_FOUND" }, { status: 404 });
  }

  const mark = await prisma.markEntry.create({
    data: {
      teacherStudentId: body.teacherStudentId,
      subject: body.subject.trim(),
      title: body.title?.trim() || null,
      score: body.score,
      maxScore: body.maxScore,
      term: body.term?.trim() || null,
    },
  });

  return NextResponse.json({ mark });
}
