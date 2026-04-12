import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyCtaiSessionJwt } from "@/lib/session-edge";

function mainAppOrigin(): string {
  return (process.env.NEXT_PUBLIC_MAIN_APP_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/business")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("ctai_session")?.value;
  const session = token ? await verifyCtaiSessionJwt(token) : null;

  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (session.role !== "TEACHER") {
    return NextResponse.redirect(new URL(mainAppOrigin()));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/business", "/business/:path*"],
};
