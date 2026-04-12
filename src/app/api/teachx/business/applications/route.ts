import type { TeachxBizAppType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeachxBusinessUser, isTeachxBusinessPlan } from "@/lib/teachx-business-gate";

export const runtime = "nodejs";

const TUTOR_MAX_PHOTO_CHARS = 350_000;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseTutorPayload(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) return null;
  const displayName = typeof payload.displayName === "string" ? payload.displayName.trim() : "";
  const subjects = typeof payload.subjects === "string" ? payload.subjects.trim() : "";
  const experience = typeof payload.experience === "string" ? payload.experience.trim() : "";
  const pricingHourly = typeof payload.pricingHourly === "string" ? payload.pricingHourly.trim() : "";
  const pricingWeekly = typeof payload.pricingWeekly === "string" ? payload.pricingWeekly.trim() : "";
  const pricingMonthly = typeof payload.pricingMonthly === "string" ? payload.pricingMonthly.trim() : "";
  const description = typeof payload.description === "string" ? payload.description.trim() : "";
  const profilePhotoDataUrl =
    typeof payload.profilePhotoDataUrl === "string" ? payload.profilePhotoDataUrl : undefined;

  if (
    !displayName ||
    !subjects ||
    !experience ||
    !pricingHourly ||
    !pricingWeekly ||
    !pricingMonthly ||
    !description
  ) {
    return null;
  }
  if (profilePhotoDataUrl && profilePhotoDataUrl.length > TUTOR_MAX_PHOTO_CHARS) {
    return null;
  }

  return {
    displayName,
    subjects,
    experience,
    pricingHourly,
    pricingWeekly,
    pricingMonthly,
    description,
    ...(profilePhotoDataUrl ? { profilePhotoDataUrl } : {}),
  };
}

function parseRootscarePayload(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) return null;
  const displayName = typeof payload.displayName === "string" ? payload.displayName.trim() : "";
  const experience = typeof payload.experience === "string" ? payload.experience.trim() : "";
  const location = typeof payload.location === "string" ? payload.location.trim() : "";
  const interestLevel = typeof payload.interestLevel === "string" ? payload.interestLevel.trim() : "";
  if (!displayName || !experience || !location || !interestLevel) return null;
  return { displayName, experience, location, interestLevel };
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const user = await getTeachxBusinessUser(session.userId);
  if (!user || !isTeachxBusinessPlan(user)) {
    return NextResponse.json({ success: false, message: "Business plan required.", code: "PLAN" }, { status: 403 });
  }

  const rows = await prisma.teachxBusinessApplication.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      payload: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ success: true, applications: rows });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const user = await getTeachxBusinessUser(session.userId);
  if (!user || !isTeachxBusinessPlan(user)) {
    return NextResponse.json({ success: false, message: "Business plan required.", code: "PLAN" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    type?: string;
    payload?: unknown;
  } | null;
  if (!body || (body.type !== "TUTOR_ONE_ON_ONE" && body.type !== "ROOTSCARE_PARTNER")) {
    return NextResponse.json({ success: false, message: "Invalid application type." }, { status: 400 });
  }

  const type = body.type as TeachxBizAppType;
  let payload: Record<string, unknown> | null = null;
  if (type === "TUTOR_ONE_ON_ONE") {
    payload = parseTutorPayload(body.payload);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid tutor application fields or photo too large." },
        { status: 400 },
      );
    }
  } else {
    payload = parseRootscarePayload(body.payload);
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid RootsCare application fields." }, { status: 400 });
    }
  }

  const existingPending = await prisma.teachxBusinessApplication.findFirst({
    where: { userId: user.id, type, status: "PENDING" },
    select: { id: true },
  });
  if (existingPending) {
    return NextResponse.json(
      { success: false, message: "You already have a pending application of this type." },
      { status: 409 },
    );
  }

  const created = await prisma.teachxBusinessApplication.create({
    data: {
      userId: user.id,
      type,
      status: "PENDING",
      payload: payload as Prisma.InputJsonValue,
    },
    select: { id: true, type: true, status: true, createdAt: true },
  });

  return NextResponse.json({ success: true, application: created });
}
