import crypto from "crypto";
import Razorpay from "razorpay";
import { getRazorpayEnv } from "@/lib/env";
import { CREDIT_TOP_UP_PACKS, PLANS } from "@/lib/pricing";

export type PurchaseKind = "BASIC" | "PRO" | "ELITE" | "TOPRANK" | "CREDITS_SMALL" | "CREDITS_LARGE";

export const SUBSCRIPTION_PLANS = {
  BASIC: { name: PLANS.BASIC.name, amountInr: PLANS.BASIC.priceInr, dbPlan: "BASIC" as const },
  PRO: { name: PLANS.PRO.name, amountInr: PLANS.PRO.priceInr, dbPlan: "PRO" as const },
  ELITE: { name: PLANS.ELITE.name, amountInr: PLANS.ELITE.priceInr, dbPlan: "ELITE" as const },
  TOPRANK: { name: PLANS.TOPRANK.name, amountInr: PLANS.TOPRANK.priceInr, dbPlan: "TOPRANK" as const },
};

export const CREDIT_PACKS = {
  CREDITS_SMALL: {
    name: CREDIT_TOP_UP_PACKS.CREDITS_SMALL.name,
    amountInr: CREDIT_TOP_UP_PACKS.CREDITS_SMALL.priceInr,
    credits: CREDIT_TOP_UP_PACKS.CREDITS_SMALL.credits,
  },
  CREDITS_LARGE: {
    name: CREDIT_TOP_UP_PACKS.CREDITS_LARGE.name,
    amountInr: CREDIT_TOP_UP_PACKS.CREDITS_LARGE.priceInr,
    credits: CREDIT_TOP_UP_PACKS.CREDITS_LARGE.credits,
  },
};

export const CREDIT_COSTS = {
  LIVE_SESSION: 25,
  DOUBT_SOLVING: 10,
};

export function getRazorpayClient() {
  const env = getRazorpayEnv();
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const keySecret = getRazorpayEnv().RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;

  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return expected === signature;
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const webhookSecret = getRazorpayEnv().RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return false;

  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return expected === signature;
}
