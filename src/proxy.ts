import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * Origins that may send state-changing requests. Behind a host such as Render the app sees plain HTTP on an
 * internal address, so the public origin comes from the forwarded headers and from APP_URL.
 */
function allowedOrigins(request: NextRequest) {
  const allowed = new Set<string>([request.nextUrl.origin]);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "")).split(",")[0].trim();
  if (host) allowed.add(`${proto}://${host.split(",")[0].trim()}`);
  try {
    if (process.env.APP_URL) allowed.add(new URL(process.env.APP_URL).origin);
  } catch {
    /* ignore a malformed APP_URL */
  }
  return allowed;
}

/**
 * Runs before every admin page and API call:
 *  - admin pages redirect to the login page when signed out;
 *  - admin APIs answer 401;
 *  - state-changing requests must come from this site (basic CSRF defence on top of SameSite cookies).
 * Route handlers check the session and role again, so this is only the first gate.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (isApi && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && !allowedOrigins(request).has(origin)) {
      return NextResponse.json({ status: "fail", message: "Cross-site request blocked" }, { status: 403 });
    }
  }

  const isAdminApi = pathname.startsWith("/api/admin/");
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  if (!isAdminApi && !isAdminPage) return NextResponse.next();

  const user = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (user) return NextResponse.next();

  if (isAdminApi) {
    return NextResponse.json({ status: "fail", message: "Please sign in to continue" }, { status: 401 });
  }
  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
