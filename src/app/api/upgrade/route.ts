import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry, creditsForNewSubscription, subscriptionPeriodEnd } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { isTopRankPlan } from "@/lib/plan-tier";

export const runtime = "nodejs";

type PaidPlan = "PRO" | "ELITE" | "TOPRANK";

function simplifiedUpgradeAllowed() {
  return (
    process.env.ALLOW_SIMPLIFIED_UPGRADE === "true" ||
    process.env.SIMPLIFIED_UPGRADE === "true" ||
    process.env.NODE_ENV === "development"
  );
}

/**
 * Demo / dev shortcut: set plan + 30-day active subscription without Razorpay.
 * In production, keep `ALLOW_SIMPLIFIED_UPGRADE` unset and use `/pricing` checkout.
 */
export async function POST(request: Request) {
  if (!simplifiedUpgradeAllowed()) {
    return NextResponse.json(
      {
        success: false,
        upgradeRequired: false,
        message: "Complete checkout on the pricing page to upgrade.",
        error: "Simplified upgrade disabled.",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );
  }

  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { plan?: string } | null;
  const raw = body?.plan?.trim().toUpperCase();
  if (raw !== "PRO" && raw !== "ELITE" && raw !== "TOPRANK") {
    return NextResponse.json({ error: "Invalid plan.", code: "VALIDATION" }, { status: 400 });
  }

  const plan = raw as PaidPlan;
  await applyPlanExpiry(session.userId);

  const credits = creditsForNewSubscription(plan);
  const dbPlan = isTopRankPlan(plan) ? "TOPRANK" : plan;
  const periodEnd = subscriptionPeriodEnd();

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      plan: dbPlan,
      subscriptionStatus: "ACTIVE",
      subscriptionExpiry: periodEnd,
      isTrialActive: false,
      credits: { increment: credits },
    },
  });

  return NextResponse.json({
    success: true,
    plan: dbPlan,
    subscriptionStatus: "ACTIVE",
    subscriptionExpiry: periodEnd.toISOString(),
    creditsAdded: credits,
  });
}
