"use client";

import Link from "next/link";
import Script from "next/script";
import { useState } from "react";
import { CREDIT_TOP_UP_PACKS } from "@/lib/pricing";

type PackKind = "CREDITS_SMALL" | "CREDITS_LARGE";
type Transaction = {
  id: string;
  type: "SUBSCRIPTION" | "CREDIT_PURCHASE";
  amount: number;
  status: "CREATED" | "PAID" | "FAILED";
  createdAt: string;
};

const packs: Record<PackKind, { title: string; credits: number; amount: number }> = {
  CREDITS_SMALL: {
    title: CREDIT_TOP_UP_PACKS.CREDITS_SMALL.name,
    credits: CREDIT_TOP_UP_PACKS.CREDITS_SMALL.credits,
    amount: CREDIT_TOP_UP_PACKS.CREDITS_SMALL.priceInr,
  },
  CREDITS_LARGE: {
    title: CREDIT_TOP_UP_PACKS.CREDITS_LARGE.name,
    credits: CREDIT_TOP_UP_PACKS.CREDITS_LARGE.credits,
    amount: CREDIT_TOP_UP_PACKS.CREDITS_LARGE.priceInr,
  },
};

type CreditsClientProps = {
  initialCredits: number;
  initialTransactions: Transaction[];
  plan: string;
  subscriptionStatus: string;
  subscriptionExpiry: Date | string | null;
};

export function CreditsClient({
  initialCredits,
  initialTransactions,
  plan,
  subscriptionStatus,
  subscriptionExpiry,
}: CreditsClientProps) {
  const [credits, setCredits] = useState(initialCredits);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function reloadProfile() {
    const res = await fetch("/api/payments/me");
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success) return;
    setCredits(data.user?.credits ?? 0);
    setTransactions(data.recentTransactions ?? []);
  }

  const expiry = subscriptionExpiry ? new Date(subscriptionExpiry) : null;
  const canTopUp =
    plan !== "BASIC" &&
    subscriptionStatus === "ACTIVE" &&
    expiry !== null &&
    !Number.isNaN(expiry.getTime()) &&
    expiry > new Date();

  async function buyCredits(kind: PackKind) {
    if (!canTopUp) {
      setError("Subscribe to Pro or TopRank with an active period before buying credit top-ups.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      if (!window.Razorpay) {
        setError("Razorpay SDK not loaded.");
        return;
      }

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error ?? "Could not create order.");
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ClassteacherAI",
        description: `Buy ${packs[kind].credits} credits`,
        order_id: orderData.orderId,
        handler: async (response) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            setError(verifyData.error ?? "Payment verification failed.");
            return;
          }
          setSuccess("Credits added successfully.");
          await reloadProfile();
        },
        theme: { color: "#2563eb" },
      });
      razorpay.open();
    } catch {
      setError("Credit purchase failed.");
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <section className="mx-auto max-w-4xl space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Credit top-up</h1>
          <p className="mt-2 text-sm text-slate-600">
            Available credits: <span className="font-medium">{credits}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            AI credits are used for Nexa AI, live sessions, and other premium actions. Top-ups require an active Pro or
            TopRank subscription.
          </p>
          {!canTopUp ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {plan === "BASIC"
                ? "Starter does not include top-up packs. Upgrade to Pro or TopRank with an active period to buy credits."
                : "Your subscription is not active or has expired. Renew on the pricing page, then return here to top up."}{" "}
              <Link href="/pricing" className="font-medium text-blue-700 underline">
                View pricing
              </Link>
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(packs) as PackKind[]).map((kind) => (
            <article key={kind} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{packs[kind].title}</p>
              <p className="mt-1 text-sm text-slate-600">{packs[kind].credits} credits</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">₹{packs[kind].amount}</p>
              <button
                onClick={() => void buyCredits(kind)}
                disabled={!canTopUp}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Buy top-up
              </button>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Recent Transactions</h2>
          <div className="mt-3 space-y-2">
            {transactions.length === 0 ? (
              <p className="text-sm text-slate-500">No transactions yet.</p>
            ) : (
              transactions.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-800">
                      {item.type === "SUBSCRIPTION" ? "Subscription" : "Credit Purchase"}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    ₹{item.amount} · {item.status}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
        ) : null}
      </section>
    </>
  );
}
