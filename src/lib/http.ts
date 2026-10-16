import { ZodError } from "zod";
import { requireUser, type Role, type SessionUser } from "./auth";
import { AppError } from "./errors";

export { AppError };

export const ok = (data: unknown, status = 200) => Response.json({ status: "success", data }, { status });

export const message = (text: string, data?: unknown, status = 200) =>
  Response.json({ status: "success", message: text, data }, { status });

const clientIp = (req: Request) =>
  req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

export { clientIp };

type Ctx<P> = { params: Promise<P> };

interface RouteOptions {
  /** Roles allowed to call the route. Omit for a public route. */
  roles?: Role[];
}

/**
 * Wraps a route handler: authenticates (when roles are given), turns validation and application
 * errors into clean JSON, and logs anything unexpected without leaking details to the caller.
 */
export function route<P = Record<string, never>>(
  options: RouteOptions,
  handler: (req: Request, ctx: { params: P; user: SessionUser | null }) => Promise<Response>,
) {
  return async (req: Request, ctx: Ctx<P>): Promise<Response> => {
    try {
      const user = options.roles ? await requireUser(options.roles) : null;
      const params = (await ctx?.params) ?? ({} as P);
      return await handler(req, { params, user });
    } catch (error) {
      if (error instanceof AppError) {
        return Response.json({ status: "fail", message: error.message }, { status: error.status });
      }
      if (error instanceof ZodError) {
        const errors = error.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
        return Response.json(
          { status: "fail", message: errors[0]?.message || "Invalid input", errors },
          { status: 400 },
        );
      }
      console.error("[api] Unhandled error:", error);
      return Response.json({ status: "error", message: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

/** Reads a JSON body, treating an empty or invalid body as an empty object. */
export async function jsonBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const CUID = /^[a-z0-9]{20,32}$/i;

export const assertId = (id: string, label: string) => {
  if (!CUID.test(id)) throw new AppError(`${label} not found`, 404);
};
