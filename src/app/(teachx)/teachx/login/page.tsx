import type { Metadata } from "next";
import Link from "next/link";
import { TeachXHeader } from "@/components/teachx/teachx-header";
import { TeachXLoginForm } from "@/components/teachx/teachx-login-form";

export const metadata: Metadata = {
  title: "Log in — TeachX",
  description: "Sign in to TeachX",
};

export default function TeachXLoginPage() {
  return (
    <>
      <TeachXHeader />
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xl shadow-slate-200/40">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">TeachX</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in with your TeachX or ClassteacherAI account.</p>
          <div className="mt-8">
            <TeachXLoginForm />
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">
            Student app?{" "}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:underline">
              ClassteacherAI login
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
