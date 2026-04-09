import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const performance = await prisma.studentPerformance.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const weakAreaCount: Record<string, number> = {};
  for (const row of performance) {
    for (const weak of row.weakAreas) {
      weakAreaCount[weak] = (weakAreaCount[weak] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    performance,
    weakAreas: Object.entries(weakAreaCount)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count),
  });
}
