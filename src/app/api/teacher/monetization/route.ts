import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const profile = await prisma.teacherProfile.findUnique({ where: { userId: session.userId } });
  const reviews = await prisma.teacherReview.findMany({
    where: { teacherId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const sessions = await prisma.sessionBooking.findMany({
    where: { teacherId: session.userId },
    orderBy: { scheduledAt: "desc" },
    take: 20,
  });
  const earnings = await prisma.earningLedger.aggregate({
    where: { userId: session.userId },
    _sum: { amount: true },
  });

  return NextResponse.json({
    profile,
    reviews,
    sessions,
    earningsTotal: earnings._sum.amount ?? 0,
  });
}
