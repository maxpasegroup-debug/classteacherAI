import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function isAdminEmail(email: string) {
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return list.includes(email);
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }
  const adminUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  if (!adminUser || !isAdminEmail(adminUser.email)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const [users, payments, conversations, bookings] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.conversation.count(),
    prisma.sessionBooking.count(),
  ]);

  const revenue = await prisma.transaction.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  return NextResponse.json({
    users,
    payments,
    conversations,
    bookings,
    revenue: revenue._sum.amount ?? 0,
  });
}
