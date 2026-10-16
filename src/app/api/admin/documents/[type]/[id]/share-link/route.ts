import { BILLING_ROLES } from "@/lib/auth";
import { jsonBody, ok, route } from "@/lib/http";
import { ensureShareToken, kindFromParam, loadDocument, shareUrl } from "@/lib/billing/documents";

export const POST = route<{ type: string; id: string }>({ roles: BILLING_ROLES }, async (req, { params }) => {
  const kind = kindFromParam(params.type);
  const { record } = await loadDocument(kind, params.id);
  const body = await jsonBody(req);
  const token = await ensureShareToken(kind, record, body.rotate === true);
  return ok({ url: shareUrl(token) });
});
