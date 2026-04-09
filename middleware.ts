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

function isAdminEmail(email: string) {
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return list.includes(email);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSession(request);
  const loggedIn = Boolean(session);
  const isApi = pathname.startsWith("/api/");

  function unauthorized() {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  function forbidden() {
    if (isApi) {
      return NextResponse.json({ error: "Forbidden.", code: "FORBIDDEN" }, { status: 403 });
    }
    const fallback = session?.activeRole === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard";
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  if (pathname.startsWith("/api/nexa")) {
    if (!loggedIn) return unauthorized();
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!session) return unauthorized();
    if (!isAdminEmail(session.email)) return forbidden();
    return NextResponse.next();
  }

  if (pathname.startsWith("/teacher") || pathname.startsWith("/api/teacher")) {
    if (!loggedIn) return unauthorized();
    if (session?.activeRole !== "TEACHER") return forbidden();
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/students/teachers") && request.method === "GET") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/exam/leaderboard")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/rank")) {
    if (!loggedIn) return unauthorized();
    if (session?.activeRole !== "STUDENT") return forbidden();
    return NextResponse.next();
  }

  if (pathname.startsWith("/notifications") || pathname.startsWith("/skills")) {
    if (!loggedIn) return unauthorized();
    return NextResponse.next();
  }

  if (pathname.startsWith("/rootcare")) {
    if (!loggedIn) return unauthorized();
    if (session?.activeRole !== "STUDENT") return forbidden();
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/rootcare")) {
    if (!loggedIn) return unauthorized();
    if (session?.activeRole !== "STUDENT") return forbidden();
    return NextResponse.next();
  }

  if (pathname.startsWith("/student") || pathname.startsWith("/api/students") || pathname.startsWith("/api/exam")) {
    if (!loggedIn) return unauthorized();
    if (session?.activeRole !== "STUDENT") return forbidden();
    if (pathname.startsWith("/student/top10")) {
      if (session.plan === "BASIC" || session.plan === "PRO") {
        return NextResponse.redirect(new URL("/pricing", request.url));
      }
    }
    return NextResponse.next();
  }

  const isMainAppRoute =
    pathname.startsWith("/today") ||
    pathname.startsWith("/nexa") ||
    pathname.startsWith("/classes") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/credits");

  if ((isMainAppRoute || pathname.startsWith("/dashboard")) && !loggedIn) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (pathname.startsWith("/auth") && loggedIn) {
    const destination = session?.activeRole === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
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
