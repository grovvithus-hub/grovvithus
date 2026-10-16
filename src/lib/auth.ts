import { cookies } from "next/headers";
import { AppError } from "./errors";
import { prisma } from "./db";
import { SESSION_COOKIE, verifySessionToken, type Role, type SessionUser } from "./session";

export { SESSION_COOKIE, createSessionToken, sessionCookieOptions, type Role, type SessionUser } from "./session";

/** Roles that may work with quotations, invoices, clients and leads. */
export const BILLING_ROLES: Role[] = ["SUPER_ADMIN", "SALES"];
/** Roles that may manage website content (portfolio, media). */
export const CONTENT_ROLES: Role[] = ["SUPER_ADMIN", "EDITOR"];
/** Roles that may change company settings, bank details and users. */
export const ADMIN_ONLY: Role[] = ["SUPER_ADMIN"];

/** The signed-in user, or null. Also checks that the account still exists and is active. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const session = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.isActive) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
}

/** Throws 401 when signed out and 403 when the role is not allowed. */
export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AppError("Please sign in to continue", 401);
  if (roles && !roles.includes(user.role)) throw new AppError("You do not have permission to do this", 403);
  return user;
}
