"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UpgradeModal } from "@/components/upgrade-modal";
import { AI_ACCESS_RULES, CREDIT_TOP_UP_PACKS, PLANS, subscriptionTierLabel } from "@/lib/pricing";
import type { PurchaseKind } from "@/lib/payments";

type UserData = {
  name?: string;
  plan: string;
  credits?: number;
  subscriptionStatus?: string;
  subscriptionExpiry?: string | null;
};

type PlanPurchaseKind = "BASIC_MONTHLY" | "PRO" | "ELITE" | "TOPRANK";

type ModalTarget =
  | { kind: "plan"; plan: PlanPurchaseKind }
  | { kind: "credits"; pack: "CREDITS_SMALL" | "CREDITS_LARGE" };

const TIER_KEYS = ["BASIC", "PRO", "ELITE", "TOPRANK"] as const;

function isPaidPeriod(user: UserData | null): boolean {
  if (!user || user.subscriptionStatus !== "ACTIVE") return false;
  if (!user.subscriptionExpiry) return false;
  const ex = new Date(user.subscriptionExpiry);
  return !Number.isNaN(ex.getTime()) && ex > new Date();
}

export default function PricingPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [modal, setModal] = useState<ModalTarget | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/payments/me");
    if (!res.ok) return;
    const data = await res.json();
    if (data.success && data.user) setUser(data.user);
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const paidActive = useMemo(() => isPaidPeriod(user), [user]);

  const canTopUpCredits = useMemo(() => {
    if (!user || user.plan === "BASIC") return false;
    return paidActive;
  }, [user, paidActive]);

  const launchPayment = useCallback(async (kind: PurchaseKind) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!window.Razorpay) {
        setError("Razorpay SDK not loaded. Please refresh.");
        return;
      }

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error ?? "Could not create payment order.");
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ClassteacherAI",
        description: "Secure payment",
        order_id: orderData.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
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
          setSuccess("Payment successful. Your account has been updated.");
          setModal(null);
          await fetchProfile();
        },
        theme: { color: "#0f172a" },
      });
      razorpay.open();
    } catch {
      setError("Payment failed to initialize.");
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  const recommendedKey: (typeof TIER_KEYS)[number] = "TOPRANK";

  const creditBalance = user?.credits ?? 0;

  function planModalTitle(plan: ModalTarget & { kind: "plan" }) {
    if (plan.plan === "PRO") return `${PLANS.PRO.name} — ${PLANS.PRO.label}`;
    if (plan.plan === "ELITE") return `${PLANS.ELITE.name} — ${PLANS.ELITE.label}`;
    if (plan.plan === "TOPRANK") return `${PLANS.TOPRANK.name} — ${PLANS.TOPRANK.label}`;
    return `${PLANS.BASIC.name} — monthly`;
  }

  function planModalDescription(plan: ModalTarget & { kind: "plan" }) {
    if (plan.plan === "PRO") return PLANS.PRO.summary;
    if (plan.plan === "ELITE") return PLANS.ELITE.summary;
    if (plan.plan === "TOPRANK") return PLANS.TOPRANK.summary;
    return "Start your paid journey: limited exam attempts, basic analytics, and full platform access. Nexa coaching unlocks on Pro, Elite, or TopRank.";
  }

  function planModalDetail(plan: ModalTarget & { kind: "plan" }) {
    if (plan.plan === "PRO") return `${PLANS.PRO.creditsIncluded.toLocaleString()} AI credits included each billing cycle.`;
    if (plan.plan === "ELITE") return `${PLANS.ELITE.creditsIncluded.toLocaleString()} AI credits included each billing cycle.`;
    if (plan.plan === "TOPRANK")
      return `${PLANS.TOPRANK.creditsIncluded.toLocaleString()} AI credits included each billing cycle.`;
    return `₹${PLANS.BASIC.priceInr}/month — billed monthly.`;
  }

  function planModalAmount(plan: ModalTarget & { kind: "plan" }) {
    if (plan.plan === "PRO") return PLANS.PRO.priceInr;
    if (plan.plan === "ELITE") return PLANS.ELITE.priceInr;
    if (plan.plan === "TOPRANK") return PLANS.TOPRANK.priceInr;
    return PLANS.BASIC.priceInr;
  }

  function purchaseKindForTier(key: (typeof TIER_KEYS)[number]): PlanPurchaseKind {
    if (key === "BASIC") return "BASIC_MONTHLY";
    return key;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Pricing</h1>
          <p className="mt-2 text-sm text-slate-600">
            Pick Starter, Pro, Elite, or TopRank. Nexa AI follows your plan and credit balance.
          </p>
          {user ? (
            <p className="mt-3 text-sm text-slate-700">
              Signed in as <span className="font-medium">{user.name ?? "Member"}</span> · Plan:{" "}
              <span className="font-medium">{subscriptionTierLabel(user.plan)}</span>
              {!paidActive ? <span className="text-amber-700"> · Preview — subscribe to unlock features</span> : null}
              {" · "}
              AI credits: <span className="font-medium">{creditBalance}</span>
              {user.subscriptionExpiry ? (
                <>
                  {" "}
                  · Renews / expires:{" "}
                  <span className="font-medium">{new Date(user.subscriptionExpiry).toLocaleDateString()}</span>
                </>
              ) : null}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Sign in to subscribe or top up credits.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/credits" className="font-medium text-blue-600 hover:text-blue-700">
              Credit top-up page
            </Link>
            <Link href="/auth/login" className="font-medium text-slate-600 hover:text-slate-800">
              Sign in
            </Link>
          </div>
        </div>

        <div id="compare" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIER_KEYS.map((key) => {
            const p = PLANS[key];
            const purchaseKey = purchaseKindForTier(key);
            const isCurrent = Boolean(user && user.plan === key && paidActive);
            const isRecommended = key === recommendedKey;

            return (
              <article
                key={key}
                id={
                  key === "BASIC"
                    ? "starter"
                    : key === "PRO"
                      ? "pro"
                      : key === "ELITE"
                        ? "elite"
                        : key === "TOPRANK"
                          ? "toprank"
                          : undefined
                }
                className={`flex flex-col rounded-2xl border p-5 shadow-sm ${
                  isRecommended ? "border-blue-200 bg-blue-50/40" : "border-slate-200 bg-white"
                }`}
              >
                {isRecommended ? (
                  <p className="text-xs font-semibold text-blue-700">Recommended for rank training</p>
                ) : (
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.label}</p>
                )}
                <p className="mt-1 text-lg font-semibold text-slate-900">{p.name}</p>
                <p className="mt-2 flex-1 text-sm text-slate-600">{p.summary}</p>
                <p className="mt-4 text-2xl font-semibold text-slate-900">₹{p.priceInr}/mo</p>
                {key === "BASIC" ? (
                  <p className="text-xs text-slate-500">Entry tier · AI coaching on Pro, Elite, or TopRank</p>
                ) : (
                  <p className="text-xs text-slate-500">{p.creditsIncluded.toLocaleString()} AI credits / cycle</p>
                )}
                {isCurrent ? (
                  <p className="mt-4 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-800">
                    Current plan
                  </p>
                ) : (
                  <button
                    type="button"
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    onClick={() => setModal({ kind: "plan", plan: purchaseKey })}
                  >
                    {key === "BASIC" ? "Start with ₹499" : user && !paidActive ? "Subscribe" : "Upgrade"}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">When can I use Nexa AI?</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
            {AI_ACCESS_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            If your subscription expires, features lock until you renew Starter, Pro, Elite, or TopRank.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">AI credit top-up</h2>
          <p className="mt-1 text-sm text-slate-600">
            Extra AI credits while your Pro, Elite, or TopRank subscription is active. Not available on Starter-only
            accounts.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(Object.keys(CREDIT_TOP_UP_PACKS) as ("CREDITS_SMALL" | "CREDITS_LARGE")[]).map((packKey) => {
              const pack = CREDIT_TOP_UP_PACKS[packKey];
              return (
                <div key={packKey} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-slate-900">{pack.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{pack.credits} credits</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">₹{pack.priceInr}</p>
                  <button
                    type="button"
                    disabled={!canTopUpCredits}
                    title={!canTopUpCredits ? "Requires active Pro, Elite, or TopRank subscription" : undefined}
                    className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setModal({ kind: "credits", pack: packKey })}
                  >
                    Buy top-up
                  </button>
                </div>
              );
            })}
          </div>
          {!canTopUpCredits && user ? (
            <p className="mt-3 text-xs text-amber-800">
              Top-up unlocks after you subscribe to Pro, Elite, or TopRank with an active billing period.
            </p>
          ) : null}
        </div>

        {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
        ) : null}
      </section>

      {modal?.kind === "plan" ? (
        <UpgradeModal
          open
          title={planModalTitle(modal)}
          description={planModalDescription(modal)}
          detail={planModalDetail(modal)}
          amountInr={planModalAmount(modal)}
          loading={loading}
          onClose={() => setModal(null)}
          onConfirm={() => void launchPayment(modal.plan)}
        />
      ) : null}
      {modal?.kind === "credits" ? (
        <UpgradeModal
          open
          title={CREDIT_TOP_UP_PACKS[modal.pack].name}
          description="Adds AI credits to your balance while your subscription is active."
          detail={`${CREDIT_TOP_UP_PACKS[modal.pack].credits} credits`}
          amountInr={CREDIT_TOP_UP_PACKS[modal.pack].priceInr}
          loading={loading}
          onClose={() => setModal(null)}
          onConfirm={() => void launchPayment(modal.pack)}
        />
      ) : null}
    </main>
  );
}
