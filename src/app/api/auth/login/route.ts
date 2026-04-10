import bcrypt from "bcryptjs";
import { setSessionCookie, signSessionToken } from "@/lib/auth";
import { applyPlanExpiry } from "@/lib/billing";
import { toSessionPayload } from "@/lib/session-payload";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }

    if (user.roles.length === 0) {
      return Response.json({ error: "Account has no roles assigned." }, { status: 403 });
    }

    await applyPlanExpiry(user.id);
    const refreshed = await prisma.user.findUnique({ where: { id: user.id } });
    if (!refreshed) {
      return Response.json({ error: "Login failed" }, { status: 500 });
    }

    const payload = toSessionPayload(refreshed);
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
    console.error("LOGIN ERROR:", error);
    return Response.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
