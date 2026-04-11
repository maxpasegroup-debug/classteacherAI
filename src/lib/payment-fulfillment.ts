import type { Prisma, TransactionType } from "@prisma/client";
import { creditsForNewSubscription, subscriptionPeriodEnd } from "@/lib/billing";
import { isTopRankPlan } from "@/lib/plan-tier";

type Tx = Prisma.TransactionClient;

export async function applyTransactionFulfillment(
  tx: Tx,
  transaction: {
    id: string;
    userId: string;
    type: TransactionType;
    plan: string | null;
    creditsPurchased: number | null;
  },
  razorpayPaymentId: string,
) {
  await tx.transaction.update({
    where: { id: transaction.id },
    data: { status: "PAID", razorpayPaymentId },
  });

  if (transaction.type === "SUBSCRIPTION" && transaction.plan) {
    const p = transaction.plan;

    if (p === "BASIC") {
      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          plan: "BASIC",
          subscriptionStatus: "ACTIVE",
          subscriptionExpiry: subscriptionPeriodEnd(),
        },
      });
      return;
    }

    if (p === "PRO" || p === "ELITE" || isTopRankPlan(p)) {
      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          plan: isTopRankPlan(p) ? "TOPRANK" : p,
          subscriptionStatus: "ACTIVE",
          subscriptionExpiry: subscriptionPeriodEnd(),
          credits: { increment: creditsForNewSubscription(isTopRankPlan(p) ? "TOPRANK" : p) },
        },
      });
    }
    return;
  }

  if (transaction.type === "CREDIT_PURCHASE" && transaction.creditsPurchased && transaction.creditsPurchased > 0) {
    await tx.user.update({
      where: { id: transaction.userId },
      data: { credits: { increment: transaction.creditsPurchased } },
    });
  }
}
