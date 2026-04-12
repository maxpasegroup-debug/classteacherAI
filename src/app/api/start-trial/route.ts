import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const TRIAL_DAYS = 15;

export async function POST() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
    select: { onboardingCompleted: true },
  });
  if (!profile?.onboardingCompleted) {
    return NextResponse.json({ success: false, message: "Complete onboarding first." }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { trialStartDate: true, plan: true },
  });
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
  }

  if (user.trialStartDate) {
    return NextResponse.json({ success: false, message: "Trial already used." }, { status: 400 });
  }

  if (user.plan !== "BASIC") {
    return NextResponse.json({ success: false, message: "Trial is only available on Basic." }, { status: 400 });
  }

  const now = new Date();
  const trialEndsAt = new Date(now);
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      trialStartDate: now,
      trialEndsAt,
      isTrialActive: true,
      plan: "BASIC",
      subscriptionStatus: "ACTIVE",
      subscriptionExpiry: trialEndsAt,
    },
  });

  return NextResponse.json({ success: true });
}
