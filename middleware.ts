import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** TEMP: all auth gating disabled — re-enable protection after login is verified. */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}
