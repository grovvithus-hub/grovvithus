import { SignJWT, jwtVerify } from "jose";

// Token handling only (no database), so it can also run inside proxy.ts.

export type Role = "SUPER_ADMIN" | "SALES" | "EDITOR" | "VIEWER";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export const SESSION_COOKIE = "gv_session";
const SESSION_SECONDS = 8 * 60 * 60;

const secretKey = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set to a random value of 32+ characters");
  return new TextEncoder().encode(secret);
};

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: String(payload.email || ""),
      name: String(payload.name || ""),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_SECONDS,
});
