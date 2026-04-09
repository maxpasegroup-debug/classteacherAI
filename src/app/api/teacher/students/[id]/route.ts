import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    grade?: string;
    notes?: string;
  } | null;

  const existing = await prisma.teacherStudent.findFirst({
    where: { id, teacherId: session.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found.", code: "NOT_FOUND" }, { status: 404 });
  }

  const student = await prisma.teacherStudent.update({
    where: { id },
    data: {
      ...(body?.name !== undefined ? { name: body.name } : {}),
      ...(body?.email !== undefined ? { email: body.email || null } : {}),
      ...(body?.grade !== undefined ? { grade: body.grade || null } : {}),
      ...(body?.notes !== undefined ? { notes: body.notes || null } : {}),
    },
  });

  return NextResponse.json({ student });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.teacherStudent.findFirst({
    where: { id, teacherId: session.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found.", code: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.teacherStudent.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
