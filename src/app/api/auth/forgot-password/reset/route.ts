import { resetPasswordWithOtpRequest } from "@/lib/password-reset-otp-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return resetPasswordWithOtpRequest(request);
}
