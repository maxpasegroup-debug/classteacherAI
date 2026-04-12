import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Legacy: OTP is verified together with new password on POST /api/auth/reset-password. */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Use POST /api/auth/reset-password with email, otp, and newPassword.",
    },
    { status: 410 },
  );
}
