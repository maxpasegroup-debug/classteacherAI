import type { Prisma, SubscriptionPlan, TransactionType } from "@prisma/client";
import { aiCreditsForNewSubscription, subscriptionPeriodEnd } from "@/lib/billing";

type Tx = Prisma.TransactionClient;

export async function applyTransactionFulfillment(
  tx: Tx,
  transaction: {
    id: string;
    userId: string;
    type: TransactionType;
    plan: SubscriptionPlan | null;
    creditsPurchased: number | null;
  },
  razorpayPaymentId: string,
) {
  await tx.transaction.update({
    where: { id: transaction.id },
    data: { status: "PAID", razorpayPaymentId },
  });

  if (transaction.type === "SUBSCRIPTION" && transaction.plan) {
    if (transaction.plan === "BASIC") {
      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          plan: "BASIC",
          subscriptionStatus: "ACTIVE",
          planExpiry: subscriptionPeriodEnd(),
        },
      });
      return;
    }

    if (transaction.plan === "PRO" || transaction.plan === "TOP10") {
      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          plan: transaction.plan,
          subscriptionStatus: "ACTIVE",
          planExpiry: subscriptionPeriodEnd(),
          aiCredits: { increment: aiCreditsForNewSubscription(transaction.plan) },
        },
      });
    }
    return;
  }

  if (transaction.type === "CREDIT_PURCHASE" && transaction.creditsPurchased && transaction.creditsPurchased > 0) {
    await tx.user.update({
      where: { id: transaction.userId },
      data: { aiCredits: { increment: transaction.creditsPurchased } },
    });
  }
}
