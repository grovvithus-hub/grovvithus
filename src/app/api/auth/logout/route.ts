import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { ok, route } from "@/lib/http";

export const POST = route({}, async () => {
  (await cookies()).delete(SESSION_COOKIE);
  return ok(null);
});
