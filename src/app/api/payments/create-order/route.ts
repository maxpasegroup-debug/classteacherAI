import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { CREDIT_PACKS, getRazorpayClient, PurchaseKind, SUBSCRIPTION_PLANS } from "@/lib/payments";
import { getRazorpayEnv } from "@/lib/env";

export const runtime = "nodejs";

type Body = {
  kind: PurchaseKind;
};

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.kind) {
    return NextResponse.json({ error: "Invalid order request." }, { status: 400 });
  }

  const kind = body.kind;
  const isSubscription = kind === "PRO" || kind === "TOP10" || kind === "BASIC_MONTHLY";

  await applyPlanExpiry(session.userId);
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { plan: true, subscriptionStatus: true, subscriptionExpiry: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found.", code: "NOT_FOUND" }, { status: 404 });
  }

  if (!isSubscription) {
    if (user.plan === "BASIC") {
      return NextResponse.json(
        {
          error: "Upgrade to Pro or TopRank before buying AI credit top-ups.",
          code: "PLAN",
        },
        { status: 403 },
      );
    }
    if (user.subscriptionStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "Active subscription required to top up credits.", code: "SUBSCRIPTION" },
        { status: 403 },
      );
    }
    if (!user.subscriptionExpiry || user.subscriptionExpiry < new Date()) {
      return NextResponse.json(
        { error: "Subscription expired. Renew your plan to top up credits.", code: "SUBSCRIPTION" },
        { status: 403 },
      );
    }
  }

  const amountInr = isSubscription ? SUBSCRIPTION_PLANS[kind].amountInr : CREDIT_PACKS[kind].amountInr;
  const amountPaise = amountInr * 100;

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `ctai_${session.userId.slice(0, 8)}_${Date.now()}`,
    notes: {
      userId: session.userId,
      kind,
    },
  });

  await prisma.transaction.create({
    data: {
      userId: session.userId,
      type: isSubscription ? "SUBSCRIPTION" : "CREDIT_PURCHASE",
      amount: amountInr,
      status: "CREATED",
      plan: isSubscription ? SUBSCRIPTION_PLANS[kind].dbPlan : null,
      creditsPurchased: isSubscription ? null : CREDIT_PACKS[kind].credits,
      razorpayOrderId: order.id,
    },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: amountPaise,
    currency: "INR",
    keyId: getRazorpayEnv().RAZORPAY_KEY_ID,
    kind,
  });
}
