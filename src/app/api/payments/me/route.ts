import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyPlanExpiry } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await applyPlanExpiry(session.userId);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      roles: true,
      plan: true,
      credits: true,
      subscriptionStatus: true,
      subscriptionExpiry: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const recentTransactions = await prisma.transaction.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    user: {
      ...user,
      activeRole: session.activeRole,
    },
    recentTransactions,
  });
}
