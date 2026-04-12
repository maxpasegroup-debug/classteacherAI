import { NextResponse } from "next/server";

const SESSION_COOKIE = "ctai_session";

export async function POST(request: Request) {
  try {
    const acceptHeader = request.headers.get("accept") ?? "";
    if (acceptHeader.includes("application/json")) {
      const res = NextResponse.json({ success: true });
      res.cookies.set(SESSION_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return res;
    }
    const res = NextResponse.redirect(new URL("/auth/login", request.url));
    res.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return NextResponse.json({ success: false, message: "Could not sign out." }, { status: 500 });
  }
}
