"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthShell } from "@/components/auth-shell";
import { PasswordField } from "@/components/password-field";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function sendOtp(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Could not send code.");
        return;
      }
      setSuccess(data.message ?? "If this email exists, a code has been sent.");
      setStep(2);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Verification failed.");
        return;
      }
      setResetToken(data.resetToken);
      setStep(3);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Password reset failed.");
        return;
      }
      setSuccess(data.message ?? "Password updated. You can sign in now.");
      setStep(1);
      setOtp("");
      setNewPassword("");
      setResetToken("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Verify with a 6-digit code sent to your email, then set a new password."
      footer={
        <>
          Back to{" "}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-700">
            Login
          </Link>
        </>
      }
    >
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.form
            key="email"
            onSubmit={sendOtp}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-4"
          >
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
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send code"}
            </button>
          </motion.form>
        ) : step === 2 ? (
          <motion.form
            key="otp"
            onSubmit={verifyOtp}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">6-digit code</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm tracking-[0.2em] outline-none focus:border-blue-400"
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
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.form
            key="reset"
            onSubmit={resetPassword}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-4"
          >
            <PasswordField
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              disabled={loading}
            />
            <p className="text-xs text-slate-500">At least 6 characters.</p>
            <button
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              disabled={loading}
            >
              {loading ? "Updating..." : "Reset password"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {error ? <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}
    </AuthShell>
  );
}
