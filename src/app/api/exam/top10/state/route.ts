import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { accessDeniedResponse } from "@/lib/plan-access";
import { requireStudentFeature } from "@/lib/student-access";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const gate = await requireStudentFeature(session.userId, "top10_training");
  if (!gate.ok) {
    if (gate.code === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, upgradeRequired: false, message: gate.error, error: gate.error, code: gate.code },
        { status: 404 },
      );
    }
    return accessDeniedResponse({
      ok: false,
      upgradeRequired: gate.upgradeRequired ?? true,
      message: gate.error,
      code: gate.code,
    });
  }

  const state = await prisma.top10TrainingState.findUnique({
    where: { userId: session.userId },
  });

  return NextResponse.json({ state });
}
