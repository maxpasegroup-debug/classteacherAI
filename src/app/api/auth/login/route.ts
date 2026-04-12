import { NextResponse } from "next/server";
import { signSessionToken } from "@/lib/auth";
import { authJsonError } from "@/lib/auth-responses";
import { applyPlanExpiry } from "@/lib/billing";
import { comparePassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      const msg = fe.email?.[0] ?? fe.password?.[0] ?? "Enter a valid email and password.";
      return authJsonError(msg, 400);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return authJsonError("Invalid email or password.", 401);
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return authJsonError("Invalid email or password.", 401);
    }

    await applyPlanExpiry(user.id);

    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        studentProfile: { select: { onboardingCompleted: true } },
      },
    });
    if (!refreshed) {
      return authJsonError("Login failed. Please try again.", 500);
    }

    const onboardingCompleted = Boolean(refreshed.studentProfile?.onboardingCompleted);
    const token = signSessionToken({ userId: refreshed.id, onboardingCompleted });

    const response = NextResponse.json({ success: true });
    response.cookies.set("ctai_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return authJsonError("Something went wrong. Please try again.", 500);
  }
}
