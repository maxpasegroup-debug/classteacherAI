import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/payments";
import { applyTransactionFulfillment } from "@/lib/payment-fulfillment";
import { logPayment } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-razorpay-signature");
    const rawBody = await request.text();

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    const payload = JSON.parse(rawBody) as {
      event: string;
      payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
    };
    const orderId = payload.payload?.payment?.entity?.order_id;
    const paymentId = payload.payload?.payment?.entity?.id;
    if (!orderId) {
      return NextResponse.json({ ok: true });
    }

    const transaction = await prisma.transaction.findUnique({ where: { razorpayOrderId: orderId } });
    if (!transaction) {
      return NextResponse.json({ ok: true });
    }

    if (payload.event === "payment.captured") {
      if (!paymentId) {
        logPayment("webhook_missing_payment_id", { orderId });
        return NextResponse.json({ ok: true });
      }

      const paidElsewhere = await prisma.transaction.findFirst({
        where: {
          razorpayPaymentId: paymentId,
          status: "PAID",
          NOT: { id: transaction.id },
        },
      });
      if (paidElsewhere) {
        logPayment("webhook_duplicate_payment_id", { paymentId, orderId });
        return NextResponse.json({ ok: true });
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
          paymentId,
        );
      });

      logPayment("webhook_captured", { transactionId: transaction.id, orderId, paymentId });
    }

    if (payload.event === "payment.failed") {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });
      logPayment("webhook_failed", { transactionId: transaction.id, orderId });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    logPayment("webhook_error", { message: e instanceof Error ? e.message : "unknown" });
    return NextResponse.json({ error: "Webhook processing failed.", code: "WEBHOOK" }, { status: 500 });
  }
}
