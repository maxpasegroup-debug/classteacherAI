"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { PasswordField } from "@/components/password-field";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function sendOtp(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? "Could not send code.");
        return;
      }
      setInfo(data.message ?? "If this email exists, a code has been sent.");
      setStep(2);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? "Password reset failed.");
        return;
      }
      setInfo(data.message ?? "Password updated.");
      router.replace("/auth/login");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We will email a 6-digit code. Then set a new password."
      footer={
        <>
          Back to{" "}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-700">
            Login
          </Link>
        </>
      }
    >
      {step === 1 ? (
        <form onSubmit={sendOtp} className="space-y-4">
          <p className="text-xs font-medium text-slate-500">Step 1 — Your email</p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      ) : step === 2 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (!/^\d{6}$/.test(otp.trim())) {
              setError("Enter the 6-digit code from your email.");
              return;
            }
            setStep(3);
          }}
          className="space-y-4"
        >
          <p className="text-xs font-medium text-slate-500">Step 2 — OTP</p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">6-digit code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm tracking-[0.25em] outline-none focus:border-blue-400"
              placeholder="000000"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              Back
            </button>
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Continue
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">
          <p className="text-xs font-medium text-slate-500">Step 3 — New password</p>
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            disabled={loading}
          />
          <p className="text-xs text-slate-500">At least 6 characters.</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              Back
            </button>
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Saving..." : "Reset password"}
            </button>
          </div>
        </form>
      )}

      {error ? <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {info ? <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p> : null}
    </AuthShell>
  );
}
