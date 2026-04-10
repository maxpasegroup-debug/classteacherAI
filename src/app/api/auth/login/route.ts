import { setSessionCookie, signSessionToken } from "@/lib/auth";
import { authJsonError } from "@/lib/auth-responses";
import { applyPlanExpiry } from "@/lib/billing";
import { comparePassword } from "@/lib/password";
import { toSessionPayload } from "@/lib/session-payload";
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
    console.log("LOGIN:", email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        roles: true,
      },
    });

    if (!user) {
      return authJsonError("Invalid email or password.", 401);
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return authJsonError("Invalid email or password.", 401);
    }

    if (!user.roles.includes("STUDENT")) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roles: [...user.roles, "STUDENT"] },
        select: { id: true },
      });
    }

    await applyPlanExpiry(user.id);
    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        plan: true,
        subscriptionExpiry: true,
        credits: true,
        studentProfile: { select: { onboardingCompleted: true } },
      },
    });
    if (!refreshed) {
      return authJsonError("Login failed. Please try again.", 500);
    }

    const payload = toSessionPayload(refreshed, "STUDENT");
    const token = signSessionToken(payload);
    await setSessionCookie(token);

    const onboardingCompleted = Boolean(refreshed.studentProfile?.onboardingCompleted);

    return Response.json({
      success: true,
      user: {
        id: refreshed.id,
        name: refreshed.name,
        email: refreshed.email,
      },
      redirectTo: onboardingCompleted ? "/dashboard" : "/onboarding",
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return authJsonError("Something went wrong. Please try again.", 500);
  }
}
