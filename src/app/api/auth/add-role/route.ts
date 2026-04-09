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

  const body = (await request.json().catch(() => null)) as { role?: UserRole } | null;
  const role = body?.role;
  if (role !== "TEACHER" && role !== "STUDENT") {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, roles: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.roles.includes(role)) {
    const payload = toSessionPayload(user, session.activeRole);
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        activeRole: payload.activeRole,
      },
    });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      roles: { set: [...user.roles, role] },
    },
    select: { id: true, name: true, email: true, roles: true },
  });

  const token = signSessionToken(toSessionPayload(updated, session.activeRole));
  await setSessionCookie(token);

  return NextResponse.json({
    success: true,
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      roles: updated.roles,
      activeRole: session.activeRole,
    },
  });
}
