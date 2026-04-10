import { NextResponse } from "next/server";
import { getCurrentSession, setSessionCookie, signSessionToken } from "@/lib/auth";
import { toSessionPayload } from "@/lib/session-payload";
import { prisma } from "@/lib/prisma";
import { applyPlanExpiry } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Not signed in.", user: null }, { status: 401 });
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
      studentProfile: { select: { onboardingCompleted: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ success: false, message: "Session invalid.", user: null }, { status: 401 });
  }

  if (!user.roles.includes("STUDENT")) {
    return NextResponse.json({ success: false, message: "Student access required.", user: null }, { status: 401 });
  }

  const activeRole = "STUDENT";

  const rolesSynced =
    JSON.stringify([...user.roles].sort()) !== JSON.stringify([...session.roles].sort());
  const planSynced = session.plan !== user.plan;
  const expirySynced =
    (session.subscriptionExpiry ?? null) !==
    (user.subscriptionExpiry ? user.subscriptionExpiry.toISOString() : null);
  const creditsSynced = session.credits !== user.credits;

  if (rolesSynced || activeRole !== session.activeRole || planSynced || expirySynced || creditsSynced) {
    const token = signSessionToken(toSessionPayload(user, activeRole));
    await setSessionCookie(token);
  }

  const onboardingCompleted = Boolean(user.studentProfile?.onboardingCompleted);

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      activeRole,
      plan: user.plan,
      credits: user.credits,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry,
      onboardingCompleted,
    },
    redirectTo: onboardingCompleted ? "/dashboard" : "/onboarding",
  });
}
