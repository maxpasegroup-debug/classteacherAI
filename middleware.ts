import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyCtaiSessionJwt } from "@/lib/session-edge";
import type { SessionPayload } from "@/lib/session-payload";

function onboardingDone(session: SessionPayload | null): boolean {
  return Boolean(session?.onboardingCompleted);
}

async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get("ctai_session")?.value;
  if (!token) return null;
  return verifyCtaiSessionJwt(token);
}

function sessionRole(session: SessionPayload | null): "STUDENT" | "TEACHER" {
  return session?.role === "TEACHER" ? "TEACHER" : "STUDENT";
}

function isMarketingPage(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/forgot-password") return true;
  const prefixes = ["/exam-coaching", "/study-help", "/rootscare", "/pricing"];
  if (prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  if (pathname === "/skills") return true;
  return false;
}

function isOnboardingApi(path: string): boolean {
  return path === "/api/onboarding" || path.startsWith("/api/onboarding/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const session = await getSession(request);
  const loggedIn = Boolean(session?.userId);
  const done = onboardingDone(session);

  function unauthorized(message = "Unauthorized.") {
    if (isApi) {
      return NextResponse.json({ success: false, authenticated: false, message }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const onboardingPath = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const onboardingApi = isOnboardingApi(pathname);

  const isTeachxRoute = pathname === "/teachx" || pathname.startsWith("/teachx/");
  if (isTeachxRoute) {
    const isTeachxPublic =
      pathname === "/teachx" ||
      pathname === "/teachx/login" ||
      pathname.startsWith("/teachx/login/") ||
      pathname === "/teachx/signup" ||
      pathname.startsWith("/teachx/signup/") ||
      pathname === "/teachx/pricing" ||
      pathname.startsWith("/teachx/pricing/");
    if (isTeachxPublic) {
      return NextResponse.next();
    }
    if (!loggedIn) {
      if (isApi) {
        return NextResponse.json({ success: false, authenticated: false, message: "Unauthorized." }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/teachx/login", request.url));
    }
    if (sessionRole(session) !== "TEACHER") {
      if (isApi) {
        return NextResponse.json(
          { success: false, message: "TeachX is for teacher accounts.", code: "WRONG_ROLE" },
          { status: 403 },
        );
      }
      return NextResponse.redirect(new URL("/student/today", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/teacher")) {
    return NextResponse.redirect(new URL("/teachx/dashboard", request.url));
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

  if (pathname.startsWith("/api/payments/webhook")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (pathname === "/api/health") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/nexa")) {
    if (!loggedIn) return unauthorized();
    if (!done) {
      return NextResponse.json(
        { success: false, message: "Complete onboarding to continue.", code: "ONBOARDING" },
        { status: 403 },
      );
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

  if (
    pathname.startsWith("/student") ||
    pathname.startsWith("/api/students") ||
    pathname.startsWith("/api/exam") ||
    pathname.startsWith("/api/questions")
  ) {
    if (!loggedIn) return unauthorized();
    if (sessionRole(session) === "TEACHER") {
      if (isApi) {
        return NextResponse.json(
          { success: false, message: "Use your TeachX dashboard.", code: "WRONG_ROLE" },
          { status: 403 },
        );
      }
      return NextResponse.redirect(new URL("/teachx/dashboard", request.url));
    }
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

  if (isApi) {
    if (!loggedIn) return unauthorized();
    if (!done && !onboardingApi) {
      return NextResponse.json(
        { success: false, message: "Complete onboarding to continue.", code: "ONBOARDING" },
        { status: 403 },
      );
    }
    return NextResponse.next();
  }

  const isMainAppRoute =
    pathname.startsWith("/today") ||
    pathname.startsWith("/nexa") ||
    pathname.startsWith("/classes") ||
    pathname.startsWith("/credits");

  if (isMarketingPage(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/plans")) {
    if (!loggedIn) return unauthorized();
    if (sessionRole(session) === "TEACHER") {
      return NextResponse.redirect(new URL("/teachx/dashboard", request.url));
    }
    if (!done) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/auth")) {
    if (loggedIn && done) {
      if (sessionRole(session) === "TEACHER") {
        return NextResponse.redirect(new URL("/teachx/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/student/today", request.url));
    }
    if (loggedIn && !done) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.next();
  }

  if (onboardingPath) {
    if (!loggedIn) return unauthorized();
    if (sessionRole(session) === "TEACHER") {
      return NextResponse.redirect(new URL("/teachx/dashboard", request.url));
    }
    if (done) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if ((isMainAppRoute || pathname.startsWith("/dashboard")) && !loggedIn) {
    return unauthorized();
  }

  if ((isMainAppRoute || pathname.startsWith("/dashboard")) && loggedIn && sessionRole(session) === "TEACHER") {
    const teacherNexa =
      pathname === "/nexa" || pathname.startsWith("/nexa/") || pathname.startsWith("/api/nexa");
    if (teacherNexa) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/teachx/dashboard", request.url));
  }

  if ((isMainAppRoute || pathname.startsWith("/dashboard")) && loggedIn && !done) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (!loggedIn) {
    return unauthorized();
  }

  if (!done) {
    if (sessionRole(session) === "TEACHER") {
      return NextResponse.redirect(new URL("/teachx/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/api/teacher/:path*",
    "/api/students/:path*",
    "/api/exam/:path*",
    "/api/questions/:path*",
    "/api/training/:path*",
    "/api/rank/:path*",
    "/api/performance",
    "/api/performance/:path*",
    "/api/payments/:path*",
    "/api/upgrade",
    "/rootcare/:path*",
    "/api/rootcare/:path*",
    "/api/admin/:path*",
    "/api/nexa/:path*",
    "/api/onboarding",
    "/api/onboarding/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/plans",
    "/plans/:path*",
    "/api/start-trial",
    "/api/teachx",
    "/api/teachx/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/today/:path*",
    "/nexa/:path*",
    "/classes/:path*",
    "/pricing",
    "/pricing/:path*",
    "/credits/:path*",
    "/forgot-password",
    "/teachx",
    "/teachx/:path*",
    "/auth",
    "/auth/:path*",
    "/notifications/:path*",
    "/skills/:path*",
    "/exam-coaching/:path*",
    "/study-help/:path*",
    "/rootscare/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
