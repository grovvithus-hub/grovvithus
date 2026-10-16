import { BILLING_ROLES } from "@/lib/auth";
import { jsonBody, route } from "@/lib/http";
import { kindFromParam, prepareWhatsApp } from "@/lib/billing/documents";
import { whatsappSchema } from "@/lib/billing/validators";

export const POST = route<{ type: string; id: string }>({ roles: BILLING_ROLES }, async (req, { params }) => {
  const kind = kindFromParam(params.type);
  const body = whatsappSchema.parse(await jsonBody(req));
  const result = await prepareWhatsApp(kind, params.id, body);
  return Response.json({ status: "success", whatsappUrl: result.whatsappUrl, data: result });
});
