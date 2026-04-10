import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { setSessionCookie, signSessionToken } from "@/lib/auth";
import { toSessionPayload } from "@/lib/session-payload";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name?.trim() || !email || !password || !role) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    if (role !== "TEACHER" && role !== "STUDENT") {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return Response.json(
        { error: "Account already exists. Please login." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        password: hashedPassword,
        roles: [role as UserRole],
        plan: "BASIC",
        subscriptionStatus: "EXPIRED",
        planExpiry: null,
        aiCredits: 0,
      },
    });

    const payload = toSessionPayload(user, role as UserRole);
    const token = signSessionToken(payload);
    await setSessionCookie(token);

    return Response.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        activeRole: payload.activeRole,
      },
    });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    return Response.json(
      { error: "Signup failed" },
      { status: 500 }
    );
  }
}
