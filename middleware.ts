import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { normalizeSessionPayload, type SessionPayload } from "@/lib/session-payload";

const SESSION_COOKIE = "ctai_session";

function getSession(request: NextRequest): SessionPayload | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const decoded = jwt.verify(token, secret);
    return normalizeSessionPayload(decoded);
  } catch {
    return null;
  }
}

function onboardingDone(session: SessionPayload | null): boolean {
  return Boolean(session?.onboardingCompleted);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSession(request);
  const loggedIn = Boolean(session?.userId);
  const isApi = pathname.startsWith("/api/");
  const done = onboardingDone(session);

  function unauthorized(message = "Unauthorized.") {
    if (isApi) {
      return NextResponse.json({ success: false, message }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const onboardingPath = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const onboardingApi = pathname === "/api/onboarding" || pathname.startsWith("/api/onboarding/");

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
    if (!done) {
      if (isApi) {
        return NextResponse.json(
          { success: false, message: "Complete onboarding to continue.", code: "ONBOARDING" },
          { status: 403 },
        );
      }
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/rank")) {
    if (!loggedIn) return unauthorized();
    if (!done) {
      return NextResponse.json(
        { success: false, message: "Complete onboarding to continue.", code: "ONBOARDING" },
        { status: 403 },
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/notifications")) {
    if (!loggedIn) return unauthorized();
    if (!done) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/skills/learn")) {
    if (!loggedIn) return unauthorized();
    if (!done) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/rootcare") || pathname.startsWith("/api/rootcare")) {
    if (!loggedIn) return unauthorized();
    if (!done) {
      if (isApi) {
        return NextResponse.json(
          { success: false, message: "Complete onboarding to continue.", code: "ONBOARDING" },
          { status: 403 },
        );
      }
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/training")) {
    if (!loggedIn) return unauthorized();
    if (!done) {
      return NextResponse.json(
        { success: false, message: "Complete onboarding to continue.", code: "ONBOARDING" },
        { status: 403 },
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/student") || pathname.startsWith("/api/students") || pathname.startsWith("/api/exam")) {
    if (!loggedIn) return unauthorized();
    if (!done && !onboardingApi) {
      if (isApi) {
        return NextResponse.json(
          { success: false, message: "Complete onboarding to continue.", code: "ONBOARDING" },
          { status: 403 },
        );
      }
      if (pathname === "/student/top10" || pathname.startsWith("/student/top10/")) {
        const url = request.nextUrl.clone();
        url.pathname = pathname.replace("/student/top10", "/student/toprank");
        return NextResponse.redirect(url, 308);
      }
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
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
    pathname.startsWith("/credits");

  if ((isMainAppRoute || pathname.startsWith("/dashboard")) && !loggedIn) {
    return unauthorized();
  }

  if ((isMainAppRoute || pathname.startsWith("/dashboard")) && loggedIn && !done) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (onboardingPath && !loggedIn) {
    return unauthorized();
  }

  if (loggedIn && done && onboardingPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/auth") && loggedIn) {
    const dest = done ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/api/teacher/:path*",
    "/api/students/:path*",
    "/api/exam/:path*",
    "/api/training/:path*",
    "/api/rank/:path*",
    "/rootcare/:path*",
    "/api/rootcare/:path*",
    "/api/admin/:path*",
    "/api/nexa/:path*",
    "/api/onboarding",
    "/api/onboarding/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/today/:path*",
    "/nexa/:path*",
    "/classes/:path*",
    "/pricing/:path*",
    "/credits/:path*",
    "/auth",
    "/auth/:path*",
    "/notifications/:path*",
    "/skills/:path*",
  ],
};
