import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { getCurrentSession, setSessionCookie, signSessionToken } from "@/lib/auth";
import { toSessionPayload } from "@/lib/session-payload";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { activeRole?: UserRole } | null;
  const activeRole = body?.activeRole;
  if (activeRole !== "TEACHER" && activeRole !== "STUDENT") {
    return NextResponse.json({ error: "Invalid activeRole." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      roles: true,
      plan: true,
      planExpiry: true,
      aiCredits: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (!user.roles.includes(activeRole)) {
    return NextResponse.json({ error: "You do not have that role." }, { status: 403 });
  }

  const token = signSessionToken(toSessionPayload(user, activeRole));
  await setSessionCookie(token);

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      activeRole,
    },
  });
}
