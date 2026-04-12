import Link from "next/link";

const links = [
  { href: "/exam-coaching", label: "Exam Coaching" },
  { href: "/study-help", label: "Study Help" },
  { href: "/rootscare", label: "RootsCare" },
  { href: "/skills", label: "Skills" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="mt-24 border-t border-slate-200/80 bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900">
              CLASS<span className="bg-gradient-to-r from-sky-600 to-emerald-500 bg-clip-text text-transparent">TEACHER</span>AI
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
              AI-powered training built to produce top rankers — not average scores.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600" aria-label="Footer">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} className="transition hover:text-slate-900">
                {label}
              </Link>
            ))}
            <Link href="/auth/login" className="transition hover:text-slate-900">
              Sign in
            </Link>
          </nav>
        </div>
        <p className="mt-12 text-center text-xs text-slate-500 md:text-left">
          © {new Date().getFullYear()} ClassteacherAI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
