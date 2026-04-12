"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function TeachXSignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Signup-Source": "teachx",
        },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      });
      const data = (await res.json()) as { success?: boolean; message?: string; redirectTo?: string };
      if (!res.ok || !data.success) {
        setError(data.message ?? "Could not create account.");
        return;
      }
      const dest = typeof data.redirectTo === "string" ? data.redirectTo : "/dashboard";
      router.push(dest);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="teachx-su-name" className="mb-1 block text-sm font-medium text-slate-700">
          Full name
        </label>
        <input
          id="teachx-su-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/20 transition focus:border-blue-400 focus:ring-4"
        />
      </div>
      <div>
        <label htmlFor="teachx-su-email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="teachx-su-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/20 transition focus:border-blue-400 focus:ring-4"
        />
      </div>
      <div>
        <label htmlFor="teachx-su-password" className="mb-1 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="teachx-su-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/20 transition focus:border-blue-400 focus:ring-4"
        />
        <p className="mt-1 text-xs text-slate-500">At least 6 characters.</p>
      </div>
      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:opacity-95 disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Create teacher account"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
          Log in
        </Link>
      </p>
    </form>
  );
}
