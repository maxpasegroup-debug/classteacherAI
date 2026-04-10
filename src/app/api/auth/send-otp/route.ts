import { handleSendOtp } from "@/lib/auth-otp-flow";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleSendOtp(request);
}
