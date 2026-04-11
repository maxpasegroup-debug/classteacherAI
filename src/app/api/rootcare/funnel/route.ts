import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  advancedRootCareUnlocked,
  ROOTCARE_EXAM_USAGE_THRESHOLD,
  ROOTCARE_HEADLINE,
  ROOTCARE_HEADLINE_REPORT,
} from "@/lib/rootcare-funnel";

export const runtime = "nodejs";

/**
 * Context for RootCare funnel nudge + tier copy (free vs advanced).
 */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const userId = session.userId;

  const [user, examSubmittedCount, assessmentCount, reportCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    }),
    prisma.examAttempt.count({
      where: { userId, submittedAt: { not: null } },
    }),
    prisma.assessmentAttempt.count({ where: { userId } }),
    prisma.careerReport.count({ where: { userId } }),
  ]);

  const plan = user?.plan ?? "BASIC";
  const advanced = advancedRootCareUnlocked(plan);

  const usageMet = examSubmittedCount >= ROOTCARE_EXAM_USAGE_THRESHOLD;
  const needsAssessment = usageMet && assessmentCount === 0;
  const needsReport = usageMet && assessmentCount > 0 && reportCount === 0;
  const suggestNudge = needsAssessment || needsReport;
  const phase: "assessment" | "report" | "complete" = needsAssessment
    ? "assessment"
    : needsReport
      ? "report"
      : "complete";
  const headline = needsReport ? ROOTCARE_HEADLINE_REPORT : ROOTCARE_HEADLINE;

  return NextResponse.json({
    headline,
    phase,
    examSubmittedCount,
    assessmentCount,
    reportCount,
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
