import { NextResponse } from "next/server";
import { getCurrentSession, setSessionCookie, signSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildStudentRankProfile } from "@/lib/student-profile";
import { toSessionPayload } from "@/lib/session-payload";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
    select: {
      onboardingCompleted: true,
      exam: true,
      targetRank: true,
      level: true,
      studyHours: true,
      weakness: true,
      trainingIntensity: true,
      recommendedDailyQuestions: true,
      weakAreaFocus: true,
      difficultyStartLevel: true,
    },
  });

  return NextResponse.json({
    success: true,
    onboardingCompleted: Boolean(profile?.onboardingCompleted),
    profile: profile ?? null,
  });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        exam?: string;
        targetRank?: number;
        level?: string;
        studyHours?: number;
        weakness?: string;
      }
    | null;

  const exam = body?.exam?.trim();
  const level = body?.level?.trim();
  const weakness = body?.weakness?.trim();
  const targetRank = Number(body?.targetRank);
  const studyHours = Number(body?.studyHours);

  if (!exam || !level || !weakness || !Number.isFinite(targetRank) || !Number.isFinite(studyHours)) {
    return NextResponse.json({ success: false, error: "Please complete all onboarding fields." }, { status: 400 });
  }

  const generated = buildStudentRankProfile({
    targetRank: Math.max(1, Math.floor(targetRank)),
    level,
    studyHours: Math.max(1, Math.floor(studyHours)),
    weakness,
  });

  const profile = await prisma.studentProfile.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      exam,
      targetRank: Math.max(1, Math.floor(targetRank)),
      level,
      studyHours: Math.max(1, Math.floor(studyHours)),
      weakness,
      onboardingCompleted: true,
      trainingIntensity: generated.trainingIntensity,
      recommendedDailyQuestions: generated.recommendedDailyQuestions,
      weakAreaFocus: generated.weakAreaFocus,
      difficultyStartLevel: generated.difficultyStartLevel,
    },
    update: {
      exam,
      targetRank: Math.max(1, Math.floor(targetRank)),
      level,
      studyHours: Math.max(1, Math.floor(studyHours)),
      weakness,
      onboardingCompleted: true,
      trainingIntensity: generated.trainingIntensity,
      recommendedDailyQuestions: generated.recommendedDailyQuestions,
      weakAreaFocus: generated.weakAreaFocus,
      difficultyStartLevel: generated.difficultyStartLevel,
    },
    select: {
      onboardingCompleted: true,
      exam: true,
      targetRank: true,
      level: true,
      studyHours: true,
      weakness: true,
      trainingIntensity: true,
      recommendedDailyQuestions: true,
      weakAreaFocus: true,
      difficultyStartLevel: true,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      roles: true,
      plan: true,
      planExpiry: true,
      aiCredits: true,
      studentProfile: { select: { onboardingCompleted: true } },
    },
  });
  if (user) {
    const token = signSessionToken(toSessionPayload(user, "STUDENT"));
    await setSessionCookie(token);
  }

  return NextResponse.json({ success: true, onboardingCompleted: true, profile });
}
