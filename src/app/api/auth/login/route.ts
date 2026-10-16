import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions, type Role } from "@/lib/auth";
import { AppError, clientIp, jsonBody, ok, route } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { logActivity } from "@/lib/billing/audit";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
// A real hash so unknown emails cost the same time as wrong passwords.
let dummyHash: string | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("not-a-real-password", 12));

export const POST = route({}, async (req) => {
  rateLimit(`login:${clientIp(req)}`, 10, 10 * 60_000);
  const parsed = schema.safeParse(await jsonBody(req));
  const fail = () => new AppError("Email or password is wrong", 401);
  if (!parsed.success) throw fail();
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    await bcrypt.compare(password, getDummyHash());
    throw fail();
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(`Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.`, 429);
  }

  if (!(await bcrypt.compare(password, user.passwordHash))) {
    const failedLogins = user.failedLogins + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: failedLogins >= MAX_FAILS ? 0 : failedLogins,
        lockedUntil: failedLogins >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    await logActivity(null, "LOGIN_FAILED", JSON.stringify({ email }), req);
    throw fail();
  }

  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  const sessionUser = { id: user.id, email: user.email, name: user.name, role: user.role as Role };
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(sessionUser), sessionCookieOptions());
  await logActivity(sessionUser, "LOGIN", "", req);
  return ok(sessionUser);
});
