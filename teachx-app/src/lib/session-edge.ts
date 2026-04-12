import { jwtVerify } from "jose";
import { normalizeSessionPayload, type SessionPayload } from "@/lib/session-payload";

/** Edge / middleware — verifies HS256 session JWTs issued by `jsonwebtoken` in Node routes. */
export async function verifyCtaiSessionJwt(token: string): Promise<SessionPayload | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return normalizeSessionPayload(payload);
  } catch {
    return null;
  }
}
