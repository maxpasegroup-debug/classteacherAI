import { sendForgotPasswordOtpRequest } from "@/lib/password-reset-otp-service";

export const runtime = "nodejs";

/** POST /api/auth/forgot-password — send 6-digit OTP (Brevo) and store row on PasswordResetOTP. */
export async function POST(request: Request) {
  return sendForgotPasswordOtpRequest(request);
}
