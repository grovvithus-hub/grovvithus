import { getSessionUser } from "@/lib/auth";
import { clientIp, ok, route } from "@/lib/http";
import { loadByToken, publicView, recordView } from "@/lib/billing/documents";
import { rateLimit } from "@/lib/ratelimit";

export const GET = route<{ token: string }>({}, async (req, { params }) => {
  rateLimit(`pub:${clientIp(req)}`, 60, 60_000);
  const { kind, record, company, totals } = await loadByToken(params.token);
  // An admin previewing the link must not count as "viewed by client".
  if (!(await getSessionUser())) await recordView(kind, record);
  return ok(await publicView(kind, record, company, totals));
});
