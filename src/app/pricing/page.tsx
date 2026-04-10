"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UpgradeModal } from "@/components/upgrade-modal";
import { AI_ACCESS_RULES, CREDIT_TOP_UP_PACKS, PLANS } from "@/lib/pricing";
import type { PurchaseKind } from "@/lib/payments";

type UserData = {
  name?: string;
  roles: ("TEACHER" | "STUDENT")[];
  activeRole: "TEACHER" | "STUDENT";
  plan: string;
  credits?: number;
  subscriptionStatus?: string;
  subscriptionExpiry?: string | null;
};

type ModalTarget =
  | { kind: "plan"; plan: "BASIC_MONTHLY" | "PRO" | "TOP10" }
  | { kind: "credits"; pack: "CREDITS_SMALL" | "CREDITS_LARGE" };

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
    setUser(data.user);
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

  const recommendedKey: "PRO" | "TOP10" = user?.activeRole === "TEACHER" ? "PRO" : "TOP10";

  const creditBalance = user?.credits ?? 0;

  const tierOrder = ["BASIC", "PRO", "TOP10"] as const;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Pricing</h1>
          <p className="mt-2 text-sm text-slate-600">
            Premium conversion model: preview the app, then pick Starter, Pro, or TopRank. Nexa AI follows your plan and
            credit balance.
          </p>
          {user ? (
            <p className="mt-3 text-sm text-slate-700">
              Signed in as <span className="font-medium">{user.name ?? "Member"}</span> · Plan:{" "}
              <span className="font-medium">
                {user.plan === "BASIC"
                  ? PLANS.BASIC.name
                  : user.plan === "PRO"
                    ? PLANS.PRO.name
                    : PLANS.TOP10.name}
              </span>
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

        <div id="compare" className="grid gap-4 md:grid-cols-3">
          {tierOrder.map((key) => {
            const p = PLANS[key];
            const purchaseKey = key === "BASIC" ? "BASIC_MONTHLY" : key;
            const isCurrent = Boolean(user && user.plan === key && paidActive);
            const isRecommended = key === recommendedKey;

            return (
              <article
                key={key}
                id={key === "BASIC" ? "starter" : key === "PRO" ? "pro" : key === "TOP10" ? "toprank" : undefined}
                className={`flex flex-col rounded-2xl border p-5 shadow-sm ${
                  isRecommended ? "border-blue-200 bg-blue-50/40" : "border-slate-200 bg-white"
                }`}
              >
                {isRecommended ? (
                  <p className="text-xs font-semibold text-blue-700">Recommended for your role</p>
                ) : (
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.label}</p>
                )}
                <p className="mt-1 text-lg font-semibold text-slate-900">{p.name}</p>
                <p className="mt-2 flex-1 text-sm text-slate-600">{p.summary}</p>
                <p className="mt-4 text-2xl font-semibold text-slate-900">₹{p.priceInr}/mo</p>
                {key === "BASIC" ? (
                  <p className="text-xs text-slate-500">Entry tier · AI coaching on Pro or TopRank</p>
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
            If your subscription expires, features lock until you renew Starter, Pro, or TopRank.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">AI credit top-up</h2>
          <p className="mt-1 text-sm text-slate-600">
            Extra AI credits while your Pro or TopRank subscription is active. Not available on Starter-only accounts.
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
                    title={!canTopUpCredits ? "Requires active Pro or TopRank subscription" : undefined}
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
              Top-up unlocks after you subscribe to Pro or TopRank with an active billing period.
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
          title={
            modal.plan === "PRO"
              ? `${PLANS.PRO.name} — ${PLANS.PRO.label}`
              : modal.plan === "TOP10"
                ? `${PLANS.TOP10.name} — ${PLANS.TOP10.label}`
                : `${PLANS.BASIC.name} — monthly`
          }
          description={
            modal.plan === "PRO"
              ? PLANS.PRO.summary
              : modal.plan === "TOP10"
                ? PLANS.TOP10.summary
                : "Start your paid journey: limited exam attempts, basic analytics, and full platform access. Nexa coaching unlocks on Pro or TopRank."
          }
          detail={
            modal.plan === "PRO"
              ? `${PLANS.PRO.creditsIncluded.toLocaleString()} AI credits included each billing cycle.`
              : modal.plan === "TOP10"
                ? `${PLANS.TOP10.creditsIncluded.toLocaleString()} AI credits included each billing cycle.`
                : `₹${PLANS.BASIC.priceInr}/month — billed monthly.`
          }
          amountInr={
            modal.plan === "PRO" ? PLANS.PRO.priceInr : modal.plan === "TOP10" ? PLANS.TOP10.priceInr : PLANS.BASIC.priceInr
          }
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
