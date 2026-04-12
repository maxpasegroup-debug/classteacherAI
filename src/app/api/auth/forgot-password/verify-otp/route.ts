import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Use POST /api/auth/reset-password with email, otp, and newPassword.",
    },
    { status: 410 },
  );
}
