import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deriveCareerSignals } from "@/lib/rootcare-career-signals";

export const runtime = "nodejs";

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const latest = await prisma.assessmentAttempt.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return NextResponse.json({ error: "No assessment found." }, { status: 404 });

  const raw = latest.answers;
  const answers =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, number>)
      : ({} as Record<string, number>);
  const { strengths, careerSuggestions } = deriveCareerSignals(answers);

  const report = await prisma.careerReport.create({
    data: {
      userId: session.userId,
      strengths,
      careerSuggestions,
      summary: `Profile score ${latest.score.toFixed(0)} — strengths below inform suggested career clusters. Re-run after big life or study shifts.`,
    },
  });

  return NextResponse.json({ ok: true, report });
}
