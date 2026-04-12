import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/brevo";
import { hashPassword } from "@/lib/password";
import { forgotPasswordEmailSchema, resetPasswordWithOtpSchema } from "@/lib/validators";

const OTP_TTL_MS = 10 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_OTP_SENDS_PER_WINDOW = 5;

function otpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendForgotPasswordOtpRequest(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = forgotPasswordEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address." }, { status: 400 });
    }

    const email = parsed.data.email;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If this email exists, a code has been sent.",
      });
    }

    const windowStart = new Date(Date.now() - RATE_WINDOW_MS);
    const recentCount = await prisma.passwordResetOTP.count({
      where: { email, createdAt: { gte: windowStart } },
    });

    if (recentCount >= MAX_OTP_SENDS_PER_WINDOW) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please wait before trying again." },
        { status: 429 },
      );
    }

    const otp = otpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await prisma.passwordResetOTP.deleteMany({ where: { email } });
    await prisma.passwordResetOTP.create({
      data: { email, otp, expiresAt },
    });

    await sendOtpEmail({ toEmail: user.email, toName: user.name, otpCode: otp });

    return NextResponse.json({
      success: true,
      message: "If this email exists, a code has been sent.",
    });
  } catch (e) {
    console.error("sendForgotPasswordOtpRequest:", e);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}

export async function resetPasswordWithOtpRequest(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = resetPasswordWithOtpSchema.safeParse(body);
    if (!parsed.success) {
      const msg =
        parsed.error.flatten().fieldErrors.newPassword?.[0] ??
        parsed.error.flatten().fieldErrors.otp?.[0] ??
        "Invalid request.";
      return NextResponse.json({ success: false, message: msg }, { status: 400 });
    }

    const { email, otp, newPassword } = parsed.data;

    const record = await prisma.passwordResetOTP.findFirst({
      where: {
        email,
        otp,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ success: false, message: "Invalid or expired OTP" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetOTP.deleteMany({ where: { email } }),
    ]);

    return NextResponse.json({ success: true, message: "Password updated. You can sign in now." });
  } catch (e) {
    console.error("resetPasswordWithOtpRequest:", e);
    return NextResponse.json({ success: false, message: "Reset failed" }, { status: 500 });
  }
}
