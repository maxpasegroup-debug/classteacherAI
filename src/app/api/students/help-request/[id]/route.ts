import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { teacherId?: string } | null;
  if (!body?.teacherId) {
    return NextResponse.json({ error: "teacherId required.", code: "VALIDATION" }, { status: 400 });
  }

  const existing = await prisma.studentHelpRequest.findFirst({
    where: { id, studentId: session.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found.", code: "NOT_FOUND" }, { status: 404 });
  }

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: body.teacherId },
  });
  if (!profile) {
    return NextResponse.json({ error: "Teacher not found.", code: "NOT_FOUND" }, { status: 404 });
  }

  const updated = await prisma.studentHelpRequest.update({
    where: { id },
    data: { matchedTeacherId: body.teacherId, status: "MATCHED" },
  });

  return NextResponse.json({ request: updated });
}
