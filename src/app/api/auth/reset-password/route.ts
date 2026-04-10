import { handleResetPassword } from "@/lib/auth-otp-flow";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleResetPassword(request);
}
