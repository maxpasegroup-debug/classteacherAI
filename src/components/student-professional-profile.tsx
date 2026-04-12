import Link from "next/link";
import type { ReactNode } from "react";
import { PLANS, subscriptionTierLabel } from "@/lib/pricing";
import { isTopRankPlan } from "@/lib/plan-tier";
import { TOPRANK_EXAM_TRACKS } from "@/lib/toprank-vision";

function examTrackLabel(trackId: string) {
  return TOPRANK_EXAM_TRACKS.find((t) => t.id === trackId)?.label ?? trackId;
}

function formatRenewal(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function planDetailsForTier(plan: string) {
  if (plan === "BASIC") return PLANS.BASIC;
  if (plan === "PRO") return PLANS.PRO;
  if (plan === "ELITE") return PLANS.ELITE;
  if (isTopRankPlan(plan)) return PLANS.TOPRANK;
  return PLANS.BASIC;
}

function statusLabel(status: string, paidActive: boolean) {
  if (status === "INACTIVE") return "Inactive";
  return paidActive ? "Active" : "Preview / limited";
}

type Vision = {
  examTrack: string;
  targetRank: number;
  targetDate: Date;
  goalCardLine: string;
  dreamCollege: string;
};

type Props = {
  onboardingExam?: string | null;
  onboardingTargetRank?: string | null;
  peerRankSnapshot?: { rank: number; percentile: number | null } | null;
  user: {
    name: string;
    email: string;
    nexaStudentLevel: string | null;
    nexaStudentSubject: string | null;
    plan: string;
    subscriptionStatus: string;
    subscriptionExpiry: Date | null;
    credits: number;
    createdAt: Date;
  };
  vision: Vision | null;
  stats: {
    totalAttempts: number;
    avgAccuracyPct: number | null;
    streakDays: number;
    rankReadiness: number | null;
  };
  paidActive: boolean;
};

function Section({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/35 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{kicker}</p>
      <h2 className="mt-1.5 text-sm font-semibold tracking-tight text-white">{title}</h2>
      <div className="mt-4 space-y-0 divide-y divide-zinc-800/80">{children}</div>
    </section>
  );
}

function Row({ label, value, action }: { label: string; value: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 first:pt-0">
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0 text-sm text-zinc-100">{value}</div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export function StudentProfessionalProfile({
  user,
  vision,
  onboardingExam,
  onboardingTargetRank,
  peerRankSnapshot,
  stats,
  paidActive,
}: Props) {
  const tier = subscriptionTierLabel(user.plan);
  const planBlock = planDetailsForTier(user.plan);

  return (
    <div className="space-y-6 pb-2">
      <header className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Profile</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{user.name}</h1>
        <p className="mt-1 text-xs text-zinc-500">
          Member since{" "}
          {user.createdAt.toLocaleDateString(undefined, { month: "short", year: "numeric" })}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/student/today"
            className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-600 hover:text-white"
          >
            Today
          </Link>
          <Link
            href="/student/performance"
            className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-600 hover:text-white"
          >
            Performance
          </Link>
          <Link
            href="/nexa"
            className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-600 hover:text-white"
          >
            Nexa
          </Link>
        </div>
      </header>

      <Section kicker="Identity" title="Basic info">
        <Row label="Email" value={<span className="break-all">{user.email}</span>} />
        <Row
          label="Study context"
          value={
            user.nexaStudentLevel || user.nexaStudentSubject ? (
              <span>
                {[user.nexaStudentLevel, user.nexaStudentSubject].filter(Boolean).join(" · ")}
              </span>
            ) : (
              <span className="text-zinc-500">Not set in Nexa</span>
            )
          }
          action={
            <Link href="/nexa" className="text-xs font-medium text-violet-400 hover:text-violet-300">
              Edit
            </Link>
          }
        />
      </Section>

      <Section kicker="Direction" title="Target exam & rank">
        {vision ? (
          <>
            <Row label="Exam track" value={examTrackLabel(vision.examTrack)} />
            <Row
              label="Target rank"
              value={<span className="tabular-nums">AIR {vision.targetRank.toLocaleString("en-IN")}</span>}
            />
            <Row label="Horizon" value={formatRenewal(vision.targetDate)} />
            <Row label="Goal" value={<span className="text-zinc-200">{vision.goalCardLine}</span>} />
            <Row label="Aspiration" value={<span className="text-zinc-400">{vision.dreamCollege}</span>} />
          </>
        ) : (
          <div className="py-3 first:pt-0 space-y-3">
            {onboardingExam ? (
              <>
                <Row label="Target exam (onboarding)" value={<span className="text-zinc-200">{onboardingExam}</span>} />
                {onboardingTargetRank ? (
                  <Row label="Target rank (onboarding)" value={<span className="text-zinc-200">{onboardingTargetRank}</span>} />
                ) : null}
              </>
            ) : null}
            <p className="text-sm text-zinc-400">
              Set a dream rank and exam to personalize missions and training intensity.
            </p>
            <Link
              href="/student/toprank"
              className="inline-flex rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Configure TopRank vision
            </Link>
          </div>
        )}
      </Section>

      <Section kicker="Membership" title="Plan details">
        <Row label="Tier" value={<span className="font-medium text-white">{tier}</span>} />
        <Row
          label="Includes"
          value={<span className="text-zinc-400 leading-relaxed">{planBlock.summary}</span>}
        />
        <Row
          label="Nexa AI"
          value={
            planBlock.aiEnabled ? (
              <span className="text-emerald-400/90">Included with active billing</span>
            ) : (
              <span className="text-zinc-500">Upgrade to Pro or TopRank</span>
            )
          }
        />
      </Section>

      <Section kicker="Progress" title="Stats snapshot">
        <div className="grid grid-cols-3 gap-3 py-4 first:pt-0">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-3 py-3 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Attempts</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white">{stats.totalAttempts}</p>
          </div>
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-3 py-3 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Accuracy</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white">
              {stats.avgAccuracyPct != null ? `${stats.avgAccuracyPct.toFixed(0)}%` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-3 py-3 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Streak</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white">{stats.streakDays}d</p>
          </div>
        </div>
        <Row
          label="Rank readiness"
          value={
            stats.rankReadiness != null ? (
              <span className="tabular-nums text-zinc-100">{stats.rankReadiness} / 100</span>
            ) : (
              <span className="text-zinc-500">Build history with graded exams</span>
            )
          }
        />
        <Row
          label="Peer rank (latest attempt)"
          value={
            peerRankSnapshot ? (
              <span className="tabular-nums text-zinc-100">
                #{peerRankSnapshot.rank}
                {peerRankSnapshot.percentile != null
                  ? ` · ~${Math.round(peerRankSnapshot.percentile)}th pct`
                  : ""}
              </span>
            ) : (
              <span className="text-zinc-500">Submit a graded exam to appear on the board</span>
            )
          }
        />
      </Section>

      <Section kicker="Billing" title="Subscription">
        <Row
          label="Status"
          value={
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                paidActive ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
              }`}
            >
              {statusLabel(user.subscriptionStatus, paidActive)}
            </span>
          }
        />
        <Row label="Renews / ends" value={formatRenewal(user.subscriptionExpiry)} />
        <Row
          label="AI credits"
          value={
            isTopRankPlan(user.plan) && user.credits > 100_000 ? (
              <span className="text-zinc-300">TopRank allowance</span>
            ) : (
              <span className="tabular-nums">{user.credits.toLocaleString("en-IN")}</span>
            )
          }
        />
        <div className="flex flex-col gap-2 pt-4">
          <Link
            href="/pricing"
            className="flex items-center justify-center rounded-xl bg-white py-3 text-center text-sm font-semibold text-zinc-950 hover:bg-zinc-100"
          >
            Manage plan
          </Link>
          <Link
            href="/credits"
            className="flex items-center justify-center rounded-xl border border-zinc-700 py-3 text-center text-sm font-semibold text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900/50"
          >
            AI credits
          </Link>
        </div>
      </Section>

    </div>
  );
}
