import bcrypt from "bcryptjs";
import { setSessionCookie, signSessionToken } from "@/lib/auth";
import { toSessionPayload } from "@/lib/session-payload";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name?.trim() || !email || !password) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        password: hashedPassword,
        roles: ["STUDENT"],
        plan: "BASIC",
        subscriptionStatus: "EXPIRED",
        planExpiry: null,
        aiCredits: 0,
      },
    });

    const payload = toSessionPayload(user, "STUDENT");
    const token = signSessionToken(payload);
    await setSessionCookie(token);

    return Response.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      redirectTo: "/onboarding",
    });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    return Response.json(
      { error: "Signup failed" },
      { status: 500 }
    );
  }
}
