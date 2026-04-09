import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireStudentFeature } from "@/lib/student-access";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const gate = await requireStudentFeature(session.userId, "top10_training");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error, code: gate.code }, { status: 403 });
  }

  const state = await prisma.top10TrainingState.findUnique({
    where: { userId: session.userId },
  });

  return NextResponse.json({ state });
}
