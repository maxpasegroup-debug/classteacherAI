import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { CardUI } from "@/components/card-ui";

export default async function TodayPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/auth/login");
  }

  const teacher = session.activeRole === "TEACHER";

  if (session.activeRole === "STUDENT") {
    redirect("/student/today");
  }

  return (
    <section className="space-y-4">
      <CardUI
        title="Your hub"
        description={
          teacher
            ? "Jump to class tools, AI, and your teacher workspace."
            : "Practice, track growth, and study with Nexa — all connected."
        }
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {teacher ? (
            <>
              <Link
                href="/teacher/dashboard"
                className="rounded-xl bg-slate-900 px-3 py-2.5 text-center text-sm font-medium text-white"
              >
                Teacher dashboard
              </Link>
              <Link
                href="/nexa"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-medium text-slate-800"
              >
                Nexa AI
              </Link>
              <Link
                href="/classes"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-medium text-slate-800"
              >
                Classes
              </Link>
              <Link
                href="/teacher/advanced"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center text-sm font-semibold text-emerald-900"
              >
                Advanced tools
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/student/today"
                className="rounded-xl bg-slate-900 px-3 py-2.5 text-center text-sm font-medium text-white"
              >
                Student dashboard
              </Link>
              <Link
                href="/nexa"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-medium text-slate-800"
              >
                Nexa AI
              </Link>
              <Link
                href="/student/exams"
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-center text-sm font-semibold text-indigo-900"
              >
                Exams &amp; leaderboard
              </Link>
              <Link
                href="/student/performance"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center text-sm font-semibold text-emerald-900"
              >
                Performance
              </Link>
            </>
          )}
        </div>
      </CardUI>

      <CardUI
        title="Focus for today"
        description="Short checklist — build one habit: one session, one review, one win."
      />
      <CardUI
        title="Progress snapshot"
        description="Detailed analytics live under Performance (students) or your class tools (teachers)."
      />
    </section>
  );
}
