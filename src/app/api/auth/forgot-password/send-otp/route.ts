import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordEmailSchema } from "@/lib/validators";
import { generateOtpCode, hashOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/brevo";

export const runtime = "nodejs";

const OTP_TTL_MINUTES = 10;
const OTP_RATE_WINDOW_MINUTES = 15;
const MAX_OTP_REQUESTS = 3;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    // Do not disclose whether email exists.
    if (!user) {
      return NextResponse.json({ ok: true, message: "If this email exists, OTP has been sent." });
    }

    const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MINUTES * 60 * 1000);
    const recentCount = await prisma.passwordResetOtp.count({
      where: { userId: user.id, createdAt: { gte: windowStart } },
    });

    if (recentCount >= MAX_OTP_REQUESTS) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait before requesting another code." },
        { status: 429 },
      );
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

    return NextResponse.json({ ok: true, message: "If this email exists, OTP has been sent." });
  } catch {
    return NextResponse.json({ error: "Unable to send OTP right now." }, { status: 500 });
  }
}
