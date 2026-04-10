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
      return Response.json({ error: "Invalid email or password." }, { status: 400 });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return Response.json({ error: "Invalid email or password." }, { status: 400 });
    }

    if (!user.roles.includes("STUDENT")) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roles: [...user.roles, "STUDENT"] },
      });
    }

    await applyPlanExpiry(user.id);
    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      include: { studentProfile: { select: { onboardingCompleted: true } } },
    });
    if (!refreshed) {
      return Response.json({ error: "Login failed" }, { status: 500 });
    }

    const payload = toSessionPayload(refreshed, "STUDENT");
    const token = signSessionToken(payload);
    await setSessionCookie(token);

    const onboardingCompleted = Boolean(refreshed.studentProfile?.onboardingCompleted);

    return Response.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      redirectTo: onboardingCompleted ? "/dashboard" : "/onboarding",
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return Response.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
