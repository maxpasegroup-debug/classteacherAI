import { resetPasswordWithOtpRequest } from "@/lib/password-reset-otp-service";

export const runtime = "nodejs";

/** POST /api/auth/reset-password — body: { email, otp, newPassword } */
export async function POST(request: Request) {
  return resetPasswordWithOtpRequest(request);
}
