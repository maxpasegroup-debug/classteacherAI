import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const students = await prisma.teacherStudent.findMany({
    where: { teacherId: session.userId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ students });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    grade?: string;
    notes?: string;
  } | null;

  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Name is required.", code: "VALIDATION" }, { status: 400 });
  }

  const student = await prisma.teacherStudent.create({
    data: {
      teacherId: session.userId,
      name: body.name.trim(),
      email: body.email?.trim() || null,
      grade: body.grade?.trim() || null,
      notes: body.notes?.trim() || null,
    },
  });

  return NextResponse.json({ student });
}
