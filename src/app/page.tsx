import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PLANS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "ClassteacherAI — Train Like a Top Ranker",
  description:
    "AI-powered exam training system designed to produce ranks, not just marks. Continuous loops, adaptive difficulty, and Nexa AI trainer.",
};

const PLAN_ORDER = ["BASIC", "PRO", "ELITE", "TOPRANK"] as const;

function IconTestTube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.611L5 14.5" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function IconBolt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function LandingBottomNav() {
  const items = [
    { href: "/", label: "Home" },
    { href: "/student/exams", label: "Exam" },
    { href: "/student/performance", label: "Rank" },
    { href: "/nexa", label: "Nexa" },
    { href: "/student/profile", label: "Profile" },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur-md md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg justify-between gap-1 px-2">
        {items.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex min-w-0 flex-1 flex-col items-center rounded-xl py-2 text-center text-[10px] font-semibold tracking-wide transition ${
              href === "/"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 pb-2 pt-6 sm:px-6">
        <span className="text-sm font-semibold tracking-tight text-slate-900">ClassteacherAI</span>
        <div className="flex items-center gap-3 text-sm font-medium">
          <Link href="/auth/login" className="text-slate-600 transition hover:text-slate-900">
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
          >
            Start
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-6 md:pb-16">
        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 lg:py-8">
          <div className="order-2 space-y-8 lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600/90">Top rank production system</p>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.25rem]">
              Train Like a Top Ranker. Become One.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              AI-powered exam training system designed to produce ranks, not just marks.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/auth/signup"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-slate-900 px-8 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
              >
                Start Training
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 text-base font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
              >
                View Plans
              </Link>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-200 shadow-2xl ring-1 ring-slate-900/5">
              <Image
                src="/images/student1.jpg"
                alt="Student focused on exam preparation"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div
                className="absolute inset-0 bg-gradient-to-tr from-slate-900/50 via-transparent to-amber-500/10"
                aria-hidden
              />
              <p className="absolute bottom-4 left-4 right-4 text-sm font-medium text-white drop-shadow-md">
                Serious practice. Real exam rhythm. Rank outcomes.
              </p>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="mt-20 space-y-10 border-t border-slate-200/80 pt-16">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              "Built for serious aspirants",
              "Designed using real exam patterns",
              "Focused on rank, not average performance",
            ].map((line) => (
              <p
                key={line}
                className="rounded-2xl border border-slate-100 bg-white/80 px-5 py-4 text-center text-sm font-medium leading-snug text-slate-700 shadow-sm"
              >
                {line}
              </p>
            ))}
          </div>
          <div className="relative aspect-[21/9] max-h-56 overflow-hidden rounded-3xl bg-slate-200 ring-1 ring-slate-900/5">
            <Image
              src="/images/student2.jpg"
              alt="Students achieving results"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/30 to-transparent" aria-hidden />
          </div>
        </section>

        {/* How it works */}
        <section className="mt-20 scroll-mt-24" id="how">
          <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">How it works</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Three moves. Continuous improvement.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Take Test",
                body: "Timed papers that mirror competition pressure — instant scoring, zero fluff.",
                Icon: IconTestTube,
              },
              {
                step: "2",
                title: "Analyze Weakness",
                body: "See exactly where speed and accuracy break — topic-level signals, not vague scores.",
                Icon: IconChart,
              },
              {
                step: "3",
                title: "Train & Improve",
                body: "Adaptive sets and Nexa debriefs pull you back until the pattern holds.",
                Icon: IconBolt,
              },
            ].map(({ step, title, body, Icon }) => (
              <div
                key={step}
                className="group rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 transition group-hover:bg-amber-100">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">Step {step}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Nexa */}
        <section className="mt-20 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/90 to-white px-6 py-12 sm:px-10 sm:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Nexa AI</h2>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Not a chatbot. A trainer.</p>
            <p className="mt-4 text-slate-600">
              Nexa reads your attempts, calls out blind spots, and tells you what to fix before the next paper — like a coach
              who never misses a pattern.
            </p>
            <blockquote className="mt-10 rounded-2xl border border-violet-200/80 bg-white px-6 py-6 text-left shadow-sm">
              <p className="text-lg font-medium leading-relaxed text-slate-800">
                &ldquo;You are losing marks due to slow thinking. Fix this now.&rdquo;
              </p>
              <footer className="mt-3 text-xs font-medium uppercase tracking-wide text-violet-600">Sample Nexa directive</footer>
            </blockquote>
          </div>
        </section>

        {/* TopRank premium */}
        <section className="mt-20 scroll-mt-24" id="toprank-system">
          <div className="overflow-hidden rounded-3xl bg-zinc-950 px-6 py-14 text-white shadow-2xl ring-1 ring-white/10 sm:px-10 sm:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400/90">Premium track</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">TopRank Training System</h2>
              <p className="mt-4 text-slate-400">
                For students who want the full loop — harder sets, stricter retries, and rank-level conditioning.
              </p>
            </div>
            <ul className="mx-auto mt-12 grid max-w-2xl gap-4 text-left sm:grid-cols-2">
              {[
                "Continuous loop training",
                "Adaptive difficulty",
                "Rank-level questions",
                "Hardcore discipline mode",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex justify-center">
              <Link
                href="/pricing#toprank"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-10 text-base font-semibold text-zinc-950 shadow-lg transition hover:opacity-95"
              >
                Unlock TopRank
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mt-20 scroll-mt-24" id="pricing">
          <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pricing</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Pick your intensity
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_ORDER.map((key) => {
              const p = PLANS[key];
              const isTop = key === "TOPRANK";
              return (
                <div
                  key={key}
                  id={isTop ? "toprank" : undefined}
                  className={`flex flex-col rounded-3xl border p-6 shadow-sm transition hover:shadow-md ${
                    isTop
                      ? "border-amber-400/60 bg-gradient-to-b from-amber-50 to-white ring-2 ring-amber-300/40"
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{p.name}</p>
                  <p className="mt-4 text-3xl font-semibold tabular-nums text-slate-950">
                    {p.priceInr === 0 ? "Free" : `₹${p.priceInr.toLocaleString("en-IN")}`}
                    {p.priceInr > 0 ? <span className="text-base font-normal text-slate-500">/mo</span> : null}
                  </p>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">{p.summary}</p>
                  <Link
                    href={p.priceInr === 0 ? "/auth/signup" : "/pricing"}
                    className={`mt-6 inline-flex h-12 items-center justify-center rounded-xl text-sm font-semibold transition ${
                      isTop
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {p.priceInr === 0 ? "Start free" : "Choose plan"}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-24 rounded-3xl bg-slate-900 px-6 py-16 text-center text-white sm:py-20">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Start your first test today</h2>
          <p className="mx-auto mt-4 max-w-md text-slate-400">
            One session is enough to feel the loop — timed attempt, instant feedback, next move locked in.
          </p>
          <Link
            href="/auth/signup"
            className="mt-10 inline-flex h-14 items-center justify-center rounded-2xl bg-white px-10 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Start Training
          </Link>
        </section>

        <footer className="mt-16 border-t border-slate-200/80 pb-8 pt-8 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ClassteacherAI</p>
          <div className="mt-3 flex flex-wrap justify-center gap-4">
            <Link href="/pricing" className="hover:text-slate-800">
              Plans
            </Link>
            <Link href="/auth/login" className="hover:text-slate-800">
              Sign in
            </Link>
          </div>
        </footer>
      </main>

      <LandingBottomNav />
    </div>
  );
}
