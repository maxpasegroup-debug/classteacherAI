import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TEACHX_PLANS, type TeachxPlanKey, isValidTeachxPlanKey } from "@/lib/teachxPlanConfig";

export const runtime = "nodejs";

function simplifiedTeachxUpgradeAllowed() {
  return (
    process.env.ALLOW_SIMPLIFIED_TEACHX_UPGRADE === "true" ||
    process.env.NODE_ENV === "development"
  );
}

/** Dev / trusted upgrade: set TeachX plan and starter AI credits (no payment). */
export async function POST(request: Request) {
  if (!simplifiedTeachxUpgradeAllowed()) {
    return NextResponse.json(
      {
        success: false,
        upgradeRequired: false,
        message: "Checkout is not enabled yet. Contact support to upgrade.",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );
  }

  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { plan?: string } | null;
  const raw = body?.plan?.trim().toUpperCase();
  if (!raw || !isValidTeachxPlanKey(raw) || raw === "FREE") {
    return NextResponse.json({ success: false, message: "Invalid plan.", code: "VALIDATION" }, { status: 400 });
  }

  const plan = raw as TeachxPlanKey;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ success: false, message: "Teachers only.", code: "FORBIDDEN" }, { status: 403 });
  }

  const credits =
    plan === "PRO" ? 500 : plan === "BUSINESS" ? 5_000 : 0;

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      teachxPlan: plan,
      teachxCredits: credits,
    },
  });

  return NextResponse.json({
    success: true,
    teachxPlan: plan,
    teachxCredits: credits,
    label: TEACHX_PLANS[plan].label,
  });
}
