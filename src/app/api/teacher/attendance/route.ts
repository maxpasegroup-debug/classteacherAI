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

  const records = await prisma.attendanceRecord.findMany({
    where: { teacherStudentId },
    orderBy: { date: "desc" },
    take: 120,
  });

  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    teacherStudentId?: string;
    date?: string;
    present?: boolean;
  } | null;

  if (!body?.teacherStudentId || !body.date) {
    return NextResponse.json({ error: "teacherStudentId and date are required.", code: "VALIDATION" }, { status: 400 });
  }

  const student = await prisma.teacherStudent.findFirst({
    where: { id: body.teacherStudentId, teacherId: session.userId },
  });
  if (!student) {
    return NextResponse.json({ error: "Not found.", code: "NOT_FOUND" }, { status: 404 });
  }

  const date = new Date(body.date);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date.", code: "VALIDATION" }, { status: 400 });
  }
  date.setUTCHours(0, 0, 0, 0);

  const record = await prisma.attendanceRecord.upsert({
    where: {
      teacherStudentId_date: { teacherStudentId: body.teacherStudentId, date },
    },
    create: {
      teacherStudentId: body.teacherStudentId,
      date,
      present: body.present !== false,
    },
    update: { present: body.present !== false },
  });

  return NextResponse.json({ record });
}
