import { NextResponse } from "next/server";

export function authJsonError(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export function authJsonOk<T extends Record<string, unknown>>(body: T) {
  return NextResponse.json({ success: true, ...body });
}
