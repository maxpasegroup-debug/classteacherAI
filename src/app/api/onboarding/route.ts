import { NextResponse } from "next/server";
import { getCurrentSession, setSessionCookie, signSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseTargetRankNumber } from "@/lib/student-profile";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
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
      },
    });

    return NextResponse.json({
      success: true,
      onboardingCompleted: Boolean(profile?.onboardingCompleted),
      profile: profile ?? null,
    });
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return NextResponse.json({ success: false, message: "Could not load onboarding." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as
      | {
          name?: string;
          exam?: string;
          targetRank?: string;
          level?: string;
          studyHours?: number;
          weakness?: string;
        }
      | null;

    const name = body?.name?.trim();
    const exam = body?.exam?.trim();
    const level = body?.level?.trim();
    const weakness = body?.weakness?.trim();
    const targetRankRaw = body?.targetRank?.trim() ?? "";
    const studyHours = Number(body?.studyHours);

    if (!exam || !level || !weakness || !targetRankRaw || !Number.isFinite(studyHours)) {
      return NextResponse.json(
        { success: false, message: "Please complete all onboarding fields." },
        { status: 400 },
      );
    }

    const hours = Math.max(1, Math.floor(studyHours));
    if (!/\d/.test(targetRankRaw)) {
      return NextResponse.json(
        { success: false, message: "Please include a number in your target rank (e.g. 500 or AIR 500)." },
        { status: 400 },
      );
    }
    parseTargetRankNumber(targetRankRaw);

    await prisma.$transaction(async (tx) => {
      if (name && name.length > 0) {
        await tx.user.update({
          where: { id: session.userId },
          data: { name },
        });
      }

      await tx.studentProfile.upsert({
        where: { userId: session.userId },
        create: {
          userId: session.userId,
          exam,
          targetRank: targetRankRaw,
          level,
          studyHours: hours,
          weakness,
          onboardingCompleted: true,
        },
        update: {
          exam,
          targetRank: targetRankRaw,
          level,
          studyHours: hours,
          weakness,
          onboardingCompleted: true,
        },
      });
    });

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      select: {
        onboardingCompleted: true,
        exam: true,
        targetRank: true,
        level: true,
        studyHours: true,
        weakness: true,
      },
    });

    const u = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    const appRole = u?.role === "TEACHER" ? "TEACHER" : "STUDENT";
    const token = signSessionToken({
      userId: session.userId,
      onboardingCompleted: true,
      role: appRole,
    });
    await setSessionCookie(token);

    return NextResponse.json({ success: true, onboardingCompleted: true, profile });
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return NextResponse.json({ success: false, message: "Could not save onboarding." }, { status: 500 });
  }
}
