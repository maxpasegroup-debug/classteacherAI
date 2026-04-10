import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import {
  dreamCollegeForRank,
  formatGoalCardLine,
  isValidExamTrack,
} from "@/lib/toprank-vision";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await applyPlanExpiry(session.userId);
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { plan: true },
  });

  if (user?.plan !== "TOP10") {
    return NextResponse.json({ vision: null, topRank: false });
  }

  const vision = await prisma.topRankVisionBoard.findUnique({
    where: { userId: session.userId },
  });

  if (!vision) {
    return NextResponse.json({ vision: null, topRank: true });
  }

  return NextResponse.json({
    topRank: true,
    vision: {
      examTrack: vision.examTrack,
      targetRank: vision.targetRank,
      targetDate: vision.targetDate.toISOString(),
      dreamCollege: vision.dreamCollege,
      goalCardLine: vision.goalCardLine,
      envStudyTable: vision.envStudyTable,
      envDistractionFree: vision.envDistractionFree,
      envDailySchedule: vision.envDailySchedule,
      updatedAt: vision.updatedAt.toISOString(),
    },
  });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await applyPlanExpiry(session.userId);
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { plan: true, subscriptionStatus: true, subscriptionExpiry: true },
  });

  if (
    user?.plan !== "TOP10" ||
    user.subscriptionStatus !== "ACTIVE" ||
    !user.subscriptionExpiry ||
    user.subscriptionExpiry < new Date()
  ) {
    return NextResponse.json({ error: "TopRank plan required.", code: "PLAN" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    examTrack?: string;
    targetRank?: number;
    targetDate?: string;
  } | null;

  if (!body?.examTrack || !isValidExamTrack(body.examTrack)) {
    return NextResponse.json({ error: "Invalid exam track." }, { status: 400 });
  }

  const targetRank = typeof body.targetRank === "number" ? Math.floor(body.targetRank) : NaN;
  if (!Number.isFinite(targetRank) || targetRank < 1 || targetRank > 500_000) {
    return NextResponse.json({ error: "Target rank must be between 1 and 500000." }, { status: 400 });
  }

  const targetDate = body.targetDate ? new Date(body.targetDate) : null;
  if (!targetDate || Number.isNaN(targetDate.getTime())) {
    return NextResponse.json({ error: "Valid target date required." }, { status: 400 });
  }

  const dreamCollege = dreamCollegeForRank(body.examTrack, targetRank);
  const goalCardLine = formatGoalCardLine(body.examTrack, targetRank, targetDate);

  const vision = await prisma.topRankVisionBoard.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      examTrack: body.examTrack,
      targetRank,
      targetDate,
      dreamCollege,
      goalCardLine,
    },
    update: {
      examTrack: body.examTrack,
      targetRank,
      targetDate,
      dreamCollege,
      goalCardLine,
    },
  });

  return NextResponse.json({
    vision: {
      examTrack: vision.examTrack,
      targetRank: vision.targetRank,
      targetDate: vision.targetDate.toISOString(),
      dreamCollege: vision.dreamCollege,
      goalCardLine: vision.goalCardLine,
      envStudyTable: vision.envStudyTable,
      envDistractionFree: vision.envDistractionFree,
      envDailySchedule: vision.envDailySchedule,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await applyPlanExpiry(session.userId);
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { plan: true },
  });

  if (user?.plan !== "TOP10") {
    return NextResponse.json({ error: "TopRank plan required." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    envStudyTable?: boolean;
    envDistractionFree?: boolean;
    envDailySchedule?: boolean;
  } | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const data: {
    envStudyTable?: boolean;
    envDistractionFree?: boolean;
    envDailySchedule?: boolean;
  } = {};

  if (typeof body.envStudyTable === "boolean") data.envStudyTable = body.envStudyTable;
  if (typeof body.envDistractionFree === "boolean") data.envDistractionFree = body.envDistractionFree;
  if (typeof body.envDailySchedule === "boolean") data.envDailySchedule = body.envDailySchedule;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No checklist fields." }, { status: 400 });
  }

  const existing = await prisma.topRankVisionBoard.findUnique({
    where: { userId: session.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Complete dream rank entry first." }, { status: 400 });
  }

  const vision = await prisma.topRankVisionBoard.update({
    where: { userId: session.userId },
    data,
  });

  return NextResponse.json({
    vision: {
      examTrack: vision.examTrack,
      targetRank: vision.targetRank,
      targetDate: vision.targetDate.toISOString(),
      dreamCollege: vision.dreamCollege,
      goalCardLine: vision.goalCardLine,
      envStudyTable: vision.envStudyTable,
      envDistractionFree: vision.envDistractionFree,
      envDailySchedule: vision.envDailySchedule,
    },
  });
}
