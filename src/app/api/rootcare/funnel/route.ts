import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { advancedRootCareUnlocked, ROOTCARE_EXAM_USAGE_THRESHOLD, ROOTCARE_HEADLINE } from "@/lib/rootcare-funnel";

export const runtime = "nodejs";

/**
 * Context for RootCare funnel nudge + tier copy (free vs advanced).
 */
export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const userId = session.userId;

  const [user, examSubmittedCount, assessmentCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    }),
    prisma.examAttempt.count({
      where: { userId, submittedAt: { not: null } },
    }),
    prisma.assessmentAttempt.count({ where: { userId } }),
  ]);

  const plan = user?.plan ?? "BASIC";
  const advanced = advancedRootCareUnlocked(plan);

  const suggestNudge =
    examSubmittedCount >= ROOTCARE_EXAM_USAGE_THRESHOLD && assessmentCount === 0;

  return NextResponse.json({
    headline: ROOTCARE_HEADLINE,
    examSubmittedCount,
    assessmentCount,
    suggestNudge,
    threshold: ROOTCARE_EXAM_USAGE_THRESHOLD,
    free: {
      basicAssessment: true,
      careerMapping: true,
    },
    advanced: {
      counseling: advanced,
      courseSuggestions: advanced,
    },
    plan,
  });
}
