import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { normalizeSessionPayload } from "@/lib/session-payload";

const SESSION_COOKIE = "ctai_session";

function getSessionUserId(request: NextRequest): string | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const decoded = jwt.verify(token, secret);
    const payload = normalizeSessionPayload(decoded);
    return payload?.userId ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = getSessionUserId(request);
  const loggedIn = Boolean(userId);
  const isApi = pathname.startsWith("/api/");

  function unauthorized(message = "Unauthorized.") {
    if (isApi) {
      return NextResponse.json({ success: false, message }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (pathname.startsWith("/teacher")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/api/teacher")) {
    return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
  }

  if (pathname.startsWith("/admin")) {
    if (!loggedIn) return unauthorized();
    return NextResponse.redirect(new URL("/student/today", request.url));
  }

  if (pathname.startsWith("/api/students/teachers") && request.method === "GET") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/exam/leaderboard")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/nexa")) {
    if (!loggedIn) return unauthorized();
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/rank")) {
    if (!loggedIn) return unauthorized();
    return NextResponse.next();
  }

  if (pathname.startsWith("/notifications") || pathname.startsWith("/skills")) {
    if (!loggedIn) return unauthorized();
    return NextResponse.next();
  }

  if (pathname.startsWith("/rootcare") || pathname.startsWith("/api/rootcare")) {
    if (!loggedIn) return unauthorized();
    return NextResponse.next();
  }

  if (pathname.startsWith("/student") || pathname.startsWith("/api/students") || pathname.startsWith("/api/exam")) {
    if (!loggedIn) return unauthorized();
    if (pathname === "/student/top10" || pathname.startsWith("/student/top10/")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.replace("/student/top10", "/student/toprank");
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  const isMainAppRoute =
    pathname.startsWith("/today") ||
    pathname.startsWith("/nexa") ||
    pathname.startsWith("/classes") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/credits");

  if ((isMainAppRoute || pathname.startsWith("/dashboard") || pathname === "/onboarding") && !loggedIn) {
    return unauthorized();
  }

  if (pathname.startsWith("/auth") && loggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/admin/:path*",
    "/api/teacher/:path*",
    "/api/students/:path*",
    "/api/exam/:path*",
    "/api/rank/:path*",
    "/rootcare/:path*",
    "/api/rootcare/:path*",
    "/api/admin/:path*",
    "/api/nexa/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/today/:path*",
    "/nexa/:path*",
    "/classes/:path*",
    "/pricing/:path*",
    "/credits/:path*",
    "/auth/:path*",
    "/notifications/:path*",
    "/skills/:path*",
  ],
};
