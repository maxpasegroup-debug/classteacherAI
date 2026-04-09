import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validators";
import { verifyPasswordResetToken } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
    }

    const { resetToken, newPassword } = parsed.data;

    let decoded: { userId: string; otpId: string; purpose: string };
    try {
      decoded = verifyPasswordResetToken(resetToken);
    } catch {
      return NextResponse.json({ error: "Reset session expired. Verify OTP again." }, { status: 401 });
    }

    if (decoded.purpose !== "password_reset") {
      return NextResponse.json({ error: "Invalid reset token." }, { status: 401 });
    }

    const otpRecord = await prisma.passwordResetOtp.findUnique({ where: { id: decoded.otpId } });
    if (!otpRecord || otpRecord.userId !== decoded.userId) {
      return NextResponse.json({ error: "Invalid reset session." }, { status: 401 });
    }

    if (!otpRecord.verifiedAt || otpRecord.expiresAt < new Date() || otpRecord.consumedAt) {
      return NextResponse.json({ error: "Reset session is no longer valid." }, { status: 401 });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: decoded.userId }, data: { password: hashedPassword } }),
      prisma.passwordResetOtp.update({ where: { id: otpRecord.id }, data: { consumedAt: new Date() } }),
    ]);

    return NextResponse.json({ ok: true, message: "Password reset successful." });
  } catch {
    return NextResponse.json({ error: "Password reset failed." }, { status: 500 });
  }
}
