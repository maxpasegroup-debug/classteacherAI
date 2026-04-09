import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CREDIT_COSTS } from "@/lib/payments";

export const runtime = "nodejs";

type Body = {
  action: "LIVE_SESSION" | "DOUBT_SOLVING";
};

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.action) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const requiredCredits = CREDIT_COSTS[body.action];
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { aiCredits: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (user.aiCredits < requiredCredits) {
    return NextResponse.json({ error: "Insufficient AI credits." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: { aiCredits: { decrement: requiredCredits } },
    select: { aiCredits: true },
  });

  return NextResponse.json({ ok: true, remainingCredits: updated.aiCredits });
}
