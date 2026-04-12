import Link from "next/link";

export function TeachXFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm font-semibold tracking-tight text-slate-800">
          <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">TEACHX</span>
          <span className="text-slate-400"> · Nexa-powered teaching</span>
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/teachx/login" className="hover:text-slate-800">
            Log in
          </Link>
          <Link href="/teachx/signup" className="hover:text-slate-800">
            Sign up
          </Link>
          <Link href="/" className="hover:text-slate-800">
            ClassteacherAI
          </Link>
        </div>
      </div>
    </footer>
  );
}
