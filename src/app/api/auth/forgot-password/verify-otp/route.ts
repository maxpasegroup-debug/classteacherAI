import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpSchema } from "@/lib/validators";
import { hashOtp } from "@/lib/otp";
import { signPasswordResetToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid OTP request." }, { status: 400 });
    }

    const { email, otp } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
    }

    const latestOtp = await prisma.passwordResetOtp.findFirst({
      where: { userId: user.id, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOtp || latestOtp.expiresAt < new Date()) {
      return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 400 });
    }

    const isValid = latestOtp.codeHash === hashOtp(otp);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
    }

    const updated = await prisma.passwordResetOtp.update({
      where: { id: latestOtp.id },
      data: { verifiedAt: new Date() },
    });

    const resetToken = signPasswordResetToken({ userId: user.id, otpId: updated.id });
    return NextResponse.json({ ok: true, resetToken });
  } catch {
    return NextResponse.json({ error: "OTP verification failed." }, { status: 500 });
  }
}
