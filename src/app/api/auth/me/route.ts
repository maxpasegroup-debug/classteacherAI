import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyPlanExpiry } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET() {
  try {
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

    const onboardingCompleted = Boolean(user.studentProfile?.onboardingCompleted);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        credits: user.credits,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry,
        onboardingCompleted,
      },
      redirectTo: onboardingCompleted ? "/dashboard" : "/onboarding",
    });
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
