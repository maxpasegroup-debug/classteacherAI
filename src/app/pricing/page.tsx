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
  aiCredits?: number;
  credits?: number;
  subscriptionStatus?: string;
  planExpiry?: string | null;
};

type ModalTarget =
  | { kind: "plan"; plan: "BASIC_MONTHLY" | "PRO" | "TOP10" }
  | { kind: "credits"; pack: "CREDITS_SMALL" | "CREDITS_LARGE" };

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

  const canTopUpCredits = useMemo(() => {
    if (!user || user.plan === "BASIC") return false;
    if (user.subscriptionStatus !== "ACTIVE") return false;
    if (!user.planExpiry) return false;
    const ex = new Date(user.planExpiry);
    return !Number.isNaN(ex.getTime()) && ex > new Date();
  }, [user]);

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

  const recommendedPlan: "PRO" | "TOP10" = user?.activeRole === "TEACHER" ? "PRO" : "TOP10";

  const creditBalance = user?.aiCredits ?? user?.credits ?? 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Pricing</h1>
          <p className="mt-2 text-sm text-slate-600">
            Student-focused tiers in INR. Nexa AI and other AI features follow your plan and AI credit balance.
          </p>
          {user ? (
            <p className="mt-3 text-sm text-slate-700">
              Signed in as <span className="font-medium">{user.name ?? "Member"}</span> · Plan:{" "}
              <span className="font-medium">{user.plan}</span> · AI credits:{" "}
              <span className="font-medium">{creditBalance}</span>
              {user.planExpiry ? (
                <>
                  {" "}
                  · Renews / expires:{" "}
                  <span className="font-medium">{new Date(user.planExpiry).toLocaleDateString()}</span>
                </>
              ) : null}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Sign in to upgrade or top up credits.</p>
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

        <div className="grid gap-4 md:grid-cols-2">
          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{PLANS.BASIC.label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{PLANS.BASIC.name}</p>
            <p className="mt-2 flex-1 text-sm text-slate-600">{PLANS.BASIC.summary}</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">30 days free</p>
            <p className="text-xs text-slate-500">Then ₹{PLANS.BASIC.priceInr}/mo</p>
            <p className="mt-2 text-xs text-slate-500">Students: limited exams and basic reports; no Nexa AI on Basic.</p>
            {user?.plan === "BASIC" ? (
              <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">Current plan</p>
            ) : null}
            {(!user || user.plan === "BASIC") && (
              <button
                type="button"
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                onClick={() => setModal({ kind: "plan", plan: "BASIC_MONTHLY" })}
              >
                Renew Basic (monthly)
              </button>
            )}
          </article>

          {(["PRO", "TOP10"] as const).map((key) => {
            const p = PLANS[key];
            const isCurrent = user?.plan === key;
            const isRecommended = key === recommendedPlan;
            return (
              <article
                key={key}
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
                <p className="text-xs text-slate-500">{p.creditsIncluded.toLocaleString()} AI credits / cycle</p>
                {isCurrent ? (
                  <p className="mt-4 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-800">
                    Current plan
                  </p>
                ) : (
                  <button
                    type="button"
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    onClick={() => setModal({ kind: "plan", plan: key })}
                  >
                    Upgrade
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
            If your subscription expires, your plan is set to Basic and AI credits are cleared until you renew.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">AI credit top-up</h2>
          <p className="mt-1 text-sm text-slate-600">
            Buy extra AI credits while your Pro or TOP10 subscription is active. Not available on Basic only.
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
                    title={!canTopUpCredits ? "Requires active Pro or TOP10 subscription" : undefined}
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
              Top-up unlocks after you subscribe to Pro or TOP10 with an active billing period.
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
                : `${PLANS.BASIC.name} (monthly)`
          }
          description={
            modal.plan === "PRO"
              ? PLANS.PRO.summary
              : modal.plan === "TOP10"
                ? PLANS.TOP10.summary
                : "Continue Basic access: limited exams, basic reports, and capped student Nexa."
          }
          detail={
            modal.plan === "PRO"
              ? `${PLANS.PRO.creditsIncluded.toLocaleString()} AI credits included each billing cycle.`
              : modal.plan === "TOP10"
                ? `${PLANS.TOP10.creditsIncluded.toLocaleString()} AI credits included each billing cycle.`
                : `₹${PLANS.BASIC.priceInr}/month — renews your Basic period.`
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
