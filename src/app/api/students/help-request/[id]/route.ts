import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CREDIT_COSTS } from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    teacherId?: string;
    subject?: string;
    scheduledAt?: string;
  } | null;

  if (!body?.teacherId || !body.subject || !body.scheduledAt) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { credits: true } });
  if (!user || user.credits < CREDIT_COSTS.LIVE_SESSION) {
    return NextResponse.json({ error: "Insufficient AI credits." }, { status: 400 });
  }

  const booking = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.userId },
      data: { credits: { decrement: CREDIT_COSTS.LIVE_SESSION } },
    });
    return tx.sessionBooking.create({
      data: {
        teacherId: body.teacherId!,
        studentId: session.userId,
        subject: body.subject!,
        scheduledAt: new Date(body.scheduledAt!),
        status: "REQUESTED",
      },
    });
  });

  return NextResponse.json({ ok: true, booking });
}
