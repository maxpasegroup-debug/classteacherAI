import type { Metadata } from "next";
import Link from "next/link";
import { TeachXHeader } from "@/components/teachx/teachx-header";
import { TeachXSignupForm } from "@/components/teachx/teachx-signup-form";

export const metadata: Metadata = {
  title: "Sign up — TeachX",
  description: "Create your TeachX teacher account",
};

export default function TeachXSignupPage() {
  return (
    <>
      <TeachXHeader />
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xl shadow-slate-200/40">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">TeachX</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Create teacher account</h1>
          <p className="mt-1 text-sm text-slate-600">You’ll be registered as a teacher with full Nexa teaching tools.</p>
          <div className="mt-8">
            <TeachXSignupForm />
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">
            Joining as a student?{" "}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:underline">
              ClassteacherAI signup
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
