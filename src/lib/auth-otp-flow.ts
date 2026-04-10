import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordEmailSchema, verifyOtpSchema, resetPasswordSchema } from "@/lib/validators";
import { generateOtpCode, hashOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/brevo";
import { signPasswordResetToken, verifyPasswordResetToken } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { authJsonError } from "@/lib/auth-responses";

export const OTP_TTL_MINUTES = 5;
const OTP_RATE_WINDOW_MINUTES = 15;
const MAX_OTP_REQUESTS = 3;

export async function handleSendOtp(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordEmailSchema.safeParse(body);

    if (!parsed.success) {
      return authJsonError("Please enter a valid email address.", 400);
    }

    const { email } = parsed.data;
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

    const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MINUTES * 60 * 1000);
    const recentCount = await prisma.passwordResetOtp.count({
      where: { userId: user.id, createdAt: { gte: windowStart } },
    });

    if (recentCount >= MAX_OTP_REQUESTS) {
      return authJsonError("Too many requests. Please wait before trying again.", 429);
    }

    const otpCode = generateOtpCode();
    const otpHash = hashOtp(otpCode);

    await prisma.passwordResetOtp.create({
      data: {
        userId: user.id,
        codeHash: otpHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      },
    });

    await sendOtpEmail({ toEmail: user.email, toName: user.name, otpCode });

    return NextResponse.json({
      success: true,
      message: "If this email exists, a code has been sent.",
    });
  } catch {
    return authJsonError("Unable to send the code right now. Try again later.", 500);
  }
}

export async function handleVerifyOtp(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return authJsonError("Enter the 6-digit code from your email.", 400);
    }

    const { email, otp } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return authJsonError("Invalid or expired code.", 400);
    }

    const latestOtp = await prisma.passwordResetOtp.findFirst({
      where: { userId: user.id, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOtp || latestOtp.expiresAt < new Date()) {
      return authJsonError("Code expired. Request a new one.", 400);
    }

    if (latestOtp.codeHash !== hashOtp(otp)) {
      return authJsonError("Invalid code.", 400);
    }

    const updated = await prisma.passwordResetOtp.update({
      where: { id: latestOtp.id },
      data: { verifiedAt: new Date() },
    });

    const resetToken = signPasswordResetToken({ userId: user.id, otpId: updated.id });
    return NextResponse.json({ success: true, resetToken });
  } catch {
    return authJsonError("Verification failed. Try again.", 500);
  }
}

export async function handleResetPassword(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      const msg = fe.newPassword?.[0] ?? fe.resetToken?.[0] ?? "Invalid password reset request.";
      return authJsonError(msg, 400);
    }

    const { resetToken, newPassword } = parsed.data;

    let decoded: { userId: string; otpId: string; purpose: string };
    try {
      decoded = verifyPasswordResetToken(resetToken);
    } catch {
      return authJsonError("Reset session expired. Verify your code again.", 401);
    }

    if (decoded.purpose !== "password_reset") {
      return authJsonError("Invalid reset session.", 401);
    }

    const otpRecord = await prisma.passwordResetOtp.findUnique({ where: { id: decoded.otpId } });
    if (!otpRecord || otpRecord.userId !== decoded.userId) {
      return authJsonError("Invalid reset session.", 401);
    }

    if (!otpRecord.verifiedAt || otpRecord.expiresAt < new Date() || otpRecord.consumedAt) {
      return authJsonError("Reset session is no longer valid.", 401);
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
        select: { id: true },
      }),
      prisma.passwordResetOtp.update({ where: { id: otpRecord.id }, data: { consumedAt: new Date() } }),
    ]);

    return NextResponse.json({ success: true, message: "Password updated. You can sign in now." });
  } catch {
    return authJsonError("Password reset failed. Try again.", 500);
  }
}
