import crypto from "node:crypto";
import { AppError, ok, route } from "@/lib/http";
import { refreshDocumentStatuses } from "@/lib/billing/status";

/**
 * Daily job (Hostinger cron or any scheduler): POST with `Authorization: Bearer <CRON_SECRET>`.
 * Keeps Expired and Overdue statuses current even when nobody opens the lists.
 */
export const POST = route({}, async (req) => {
  const secret = process.env.CRON_SECRET || "";
  const given = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  if (!secret || a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new AppError("Not allowed", 401);
  return ok(await refreshDocumentStatuses());
});
