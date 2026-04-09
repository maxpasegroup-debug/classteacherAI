import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/payments";
import { applyTransactionFulfillment } from "@/lib/payment-fulfillment";
import { logPayment } from "@/lib/logger";

export const runtime = "nodejs";

type Body = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.razorpayOrderId || !body.razorpayPaymentId || !body.razorpaySignature) {
    return NextResponse.json({ error: "Invalid verification payload.", code: "BAD_REQUEST" }, { status: 400 });
  }

  const isValid = verifyRazorpaySignature(body.razorpayOrderId, body.razorpayPaymentId, body.razorpaySignature);
  if (!isValid) {
    logPayment("verify_signature_failed", { userId: session.userId, orderId: body.razorpayOrderId });
    return NextResponse.json({ error: "Payment signature verification failed.", code: "SIGNATURE" }, { status: 400 });
  }

  const existingPayment = await prisma.transaction.findFirst({
    where: {
      razorpayPaymentId: body.razorpayPaymentId,
      status: "PAID",
    },
  });
  if (existingPayment && existingPayment.userId !== session.userId) {
    return NextResponse.json({ error: "Payment already recorded.", code: "DUPLICATE" }, { status: 409 });
  }

  const transaction = await prisma.transaction.findFirst({
    where: { razorpayOrderId: body.razorpayOrderId, userId: session.userId },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found.", code: "NOT_FOUND" }, { status: 404 });
  }

  if (transaction.status === "PAID") {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await prisma.$transaction(async (tx) => {
    const current = await tx.transaction.findUnique({ where: { id: transaction.id } });
    if (!current || current.status === "PAID") return;

    await applyTransactionFulfillment(
      tx,
      {
        id: current.id,
        userId: current.userId,
        type: current.type,
        plan: current.plan,
        creditsPurchased: current.creditsPurchased,
      },
      body.razorpayPaymentId,
    );
  });

  logPayment("verify_paid", { userId: session.userId, transactionId: transaction.id, orderId: body.razorpayOrderId });

  return NextResponse.json({ ok: true });
}
