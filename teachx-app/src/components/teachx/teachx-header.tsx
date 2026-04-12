import Link from "next/link";

export function TeachXHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="text-lg font-extrabold tracking-tight sm:text-xl">
          <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-600 bg-clip-text text-transparent">
            TEACHX
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition hover:opacity-95"
          >
            Start with TeachX
          </Link>
        </nav>
      </div>
    </header>
  );
}
