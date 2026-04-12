import { NextResponse } from "next/server";
import { applySessionCookieToResponse, signSessionToken } from "@/lib/auth";
import { authJsonError } from "@/lib/auth-responses";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { isTeachxSignupRequest } from "@/lib/signup-source";
import { signupStudentSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupStudentSchema.safeParse(body);

    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      const msg =
        fe.email?.[0] ?? fe.password?.[0] ?? fe.name?.[0] ?? "Please check your details.";
      return authJsonError(msg, 400);
    }

    const { name, email, password } = parsed.data;
    const fromTeachx = isTeachxSignupRequest(req);

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return authJsonError("An account with this email already exists.", 409);
    }

    const hashedPassword = await hashPassword(password);

    if (fromTeachx) {
      const user = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            name: name.trim(),
            email,
            password: hashedPassword,
            role: "TEACHER",
            plan: "BASIC",
            subscriptionStatus: "INACTIVE",
            subscriptionExpiry: null,
            credits: 0,
          },
          select: { id: true, name: true, email: true },
        });
        await tx.teacherProfile.create({
          data: { userId: u.id, subjects: [] },
        });
        return u;
      });

      const token = signSessionToken({
        userId: user.id,
        onboardingCompleted: true,
        role: "TEACHER",
      });
      const res = NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: "TEACHER" as const },
        redirectTo: "/teachx/dashboard",
      });
      applySessionCookieToResponse(res, token);
      return res;
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        password: hashedPassword,
        role: "STUDENT",
        plan: "BASIC",
        subscriptionStatus: "INACTIVE",
        subscriptionExpiry: null,
        credits: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const token = signSessionToken({
      userId: user.id,
      onboardingCompleted: false,
      role: "STUDENT",
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "STUDENT" as const,
      },
      redirectTo: "/onboarding",
    });
    applySessionCookieToResponse(res, token);
    return res;
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return authJsonError("Something went wrong. Please try again.", 500);
  }
}
