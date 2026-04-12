import { NextResponse } from "next/server";
import { applySessionCookieToResponse, getCurrentSession, signSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyPlanExpiry } from "@/lib/billing";
import { resolvePostAuthRedirect } from "@/lib/post-auth-redirect";
import type { AppUserRole } from "@/lib/session-payload";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, authenticated: false, message: "Not signed in.", user: null },
        { status: 401 },
      );
    }

    await applyPlanExpiry(session.userId);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        role: true,
        credits: true,
        teachxPlan: true,
        teachxCredits: true,
        subscriptionStatus: true,
        subscriptionExpiry: true,
        isTrialActive: true,
        trialEndsAt: true,
        studentProfile: { select: { onboardingCompleted: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, authenticated: false, message: "Session invalid.", user: null },
        { status: 401 },
      );
    }

    const onboardingCompleted = Boolean(user.studentProfile?.onboardingCompleted);
    const appRole: AppUserRole = user.role === "TEACHER" ? "TEACHER" : "STUDENT";
    const planSnapshot = {
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry,
      isTrialActive: user.isTrialActive,
      trialEndsAt: user.trialEndsAt,
      role: appRole,
    };
    const redirectTo = resolvePostAuthRedirect(onboardingCompleted, planSnapshot);

    const body = {
      success: true as const,
      authenticated: true as const,
      user: {
        id: user.id,
        role: appRole,
      },
      /** Optional fields for existing clients (Nexa dock, pricing, etc.). */
      profile: {
        name: user.name,
        email: user.email,
        plan: user.plan,
        credits: user.credits,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry,
        onboardingCompleted,
        ...(user.role === "TEACHER"
          ? { teachxPlan: user.teachxPlan, teachxCredits: user.teachxCredits }
          : {}),
      },
      redirectTo,
    };

    const res = NextResponse.json(body);

    const sessionRole = session.role;
    const needsTokenRefresh =
      session.onboardingCompleted !== onboardingCompleted || sessionRole !== appRole;

    if (needsTokenRefresh) {
      const token = signSessionToken({
        userId: session.userId,
        onboardingCompleted,
        role: appRole,
      });
      applySessionCookieToResponse(res, token);
    }

    return res;
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return NextResponse.json(
      { success: false, authenticated: false, message: "Something went wrong." },
      { status: 500 },
    );
  }
}
