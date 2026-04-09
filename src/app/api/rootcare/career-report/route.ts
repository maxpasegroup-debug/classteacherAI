import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const latest = await prisma.assessmentAttempt.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return NextResponse.json({ error: "No assessment found." }, { status: 404 });

  const strengths =
    latest.score > 80 ? ["Analytical thinking", "Problem solving"] : ["Consistency", "Learning agility"];
  const suggestions =
    latest.score > 80 ? ["Data Science", "Engineering", "Research"] : ["Digital Marketing", "Design", "Operations"];

  const report = await prisma.careerReport.create({
    data: {
      userId: session.userId,
      strengths,
      careerSuggestions: suggestions,
      summary: `Based on your score (${latest.score.toFixed(1)}), these career tracks are recommended.`,
    },
  });

  return NextResponse.json({ ok: true, report });
}
