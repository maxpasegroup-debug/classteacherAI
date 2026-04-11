import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await clearSessionCookie();
    const acceptHeader = request.headers.get("accept") ?? "";
    if (acceptHeader.includes("application/json")) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return NextResponse.json({ success: false, message: "Could not sign out." }, { status: 500 });
  }
}
