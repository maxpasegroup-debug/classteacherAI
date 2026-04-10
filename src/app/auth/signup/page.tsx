"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthShell } from "@/components/auth-shell";

type Role = "TEACHER" | "STUDENT";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("TEACHER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canContinue = useMemo(() => name.trim().length >= 2 && email.includes("@") && password.length >= 8, [name, email, password]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not create account.");
        return;
      }

      const createdRole = data?.user?.activeRole;
      if (createdRole === "TEACHER") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/student/today");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your AI-powered classroom journey."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-2 flex gap-2">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-slate-900" : "bg-slate-200"}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-slate-900" : "bg-slate-200"}`} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              <label className="mb-1 mt-3 block text-sm font-medium text-slate-700">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              <label className="mb-1 mt-3 block text-sm font-medium text-slate-700">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => setStep(2)}
                className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
              </button>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <label className="mb-2 block text-sm font-medium text-slate-700">Select role</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "TEACHER", label: "Teacher" },
                  { id: "STUDENT", label: "Student" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id as Role)}
                    className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      role === item.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Creating..." : "Create account"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error ? <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      </form>
    </AuthShell>
  );
}
