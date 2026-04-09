import { NextResponse } from "next/server";
import { getCurrentSession, setSessionCookie, signSessionToken } from "@/lib/auth";
import { toSessionPayload } from "@/lib/session-payload";
import { prisma } from "@/lib/prisma";
import { applyPlanExpiry } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
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
      aiCredits: true,
      subscriptionStatus: true,
      planExpiry: true,
    },
  });

  if (!user) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  if (user.roles.length === 0) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  let activeRole = session.activeRole;
  if (!user.roles.includes(activeRole)) {
    activeRole = toSessionPayload(user).activeRole;
  }

  const rolesSynced =
    JSON.stringify([...user.roles].sort()) !== JSON.stringify([...session.roles].sort());
  const planSynced = session.plan !== user.plan;
  const expirySynced =
    (session.planExpiry ?? null) !== (user.planExpiry ? user.planExpiry.toISOString() : null);
  const creditsSynced = session.aiCredits !== user.aiCredits;

  if (rolesSynced || activeRole !== session.activeRole || planSynced || expirySynced || creditsSynced) {
    const token = signSessionToken(toSessionPayload(user, activeRole));
    await setSessionCookie(token);
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      activeRole,
      plan: user.plan,
      aiCredits: user.aiCredits,
      subscriptionStatus: user.subscriptionStatus,
      planExpiry: user.planExpiry,
    },
  });
}
