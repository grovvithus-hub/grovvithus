import { prisma } from "@/lib/db";
import { route } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Lightweight health check, safe to call every few minutes.
 *  - /api/health        answers instantly (used to keep a free Render service awake)
 *  - /api/health?db=1   also checks the database connection
 */
export const GET = route({}, async (req) => {
  const checkDb = new URL(req.url).searchParams.get("db") === "1";
  let db: "skipped" | "ok" | "down" = "skipped";
  if (checkDb) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = "ok";
    } catch {
      db = "down";
    }
  }
  return Response.json({ status: db === "down" ? "degraded" : "ok", db, time: new Date().toISOString() }, { status: db === "down" ? 503 : 200, headers: { "Cache-Control": "no-store" } });
});
