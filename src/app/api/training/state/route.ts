import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trainingStateSummary } from "@/lib/training-engine";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const row = await prisma.trainingState.findUnique({ where: { userId: session.userId } });
  if (!row) {
    return NextResponse.json({ trainingState: null });
  }

  return NextResponse.json({ trainingState: trainingStateSummary(row) });
}
