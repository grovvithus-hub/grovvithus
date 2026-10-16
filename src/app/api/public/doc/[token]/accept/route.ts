import { AppError, clientIp, jsonBody, ok, route } from "@/lib/http";
import { acceptQuotation, loadByToken, notifyAdminsOfAcceptance, publicView } from "@/lib/billing/documents";
import { rateLimit } from "@/lib/ratelimit";
import { acceptSchema } from "@/lib/billing/validators";

export const POST = route<{ token: string }>({}, async (req, { params }) => {
  const ip = clientIp(req);
  rateLimit(`accept:${ip}`, 10, 10 * 60_000);
  const { name } = acceptSchema.parse(await jsonBody(req));
  const { kind, record, company, totals } = await loadByToken(params.token);
  if (kind !== "quotation") throw new AppError("Only quotations can be accepted", 400);
  if (record.validUntil && new Date(record.validUntil).getTime() < new Date().setHours(0, 0, 0, 0)) {
    throw new AppError("This quotation has expired. Please contact us for an updated quotation.", 400);
  }

  const updated = await acceptQuotation(record, name, ip);
  // Admins are told and convert to an invoice themselves (advance and milestone terms vary per deal).
  if (updated.newlyAccepted) await notifyAdminsOfAcceptance(updated, company, name);
  return ok(await publicView(kind, updated, company, totals));
});
