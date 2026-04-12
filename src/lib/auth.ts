import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getCoreEnv } from "@/lib/env";
import { normalizeSessionPayload, type SessionPayload } from "@/lib/session-payload";

export type { SessionPayload };

const SESSION_COOKIE = "ctai_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const RESET_TOKEN_TTL_SECONDS = 60 * 15;

type ResetPayload = {
  userId: string;
  otpId: string;
  purpose: "password_reset";
};

function getJwtSecret() {
  const secret = getCoreEnv().JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set.");
  }
  return secret;
}

export function signSessionToken(payload: SessionPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_TTL_SECONDS });
}

export function verifySessionToken(token: string): SessionPayload {
  const decoded = jwt.verify(token, getJwtSecret());
  const normalized = normalizeSessionPayload(decoded);
  if (!normalized) {
    throw new Error("Invalid session token.");
  }
  return normalized;
}

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_TTL_SECONDS,
  path: "/",
};

/** Prefer this in Route Handlers — pairs the cookie with the JSON body reliably. */
export function applySessionCookieToResponse(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export function signPasswordResetToken(payload: Omit<ResetPayload, "purpose">) {
  return jwt.sign({ ...payload, purpose: "password_reset" }, getJwtSecret(), {
    expiresIn: RESET_TOKEN_TTL_SECONDS,
  });
}

export function verifyPasswordResetToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as ResetPayload;
}
