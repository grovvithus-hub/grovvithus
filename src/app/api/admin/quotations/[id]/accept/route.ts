import { BILLING_ROLES } from "@/lib/auth";
import { message, route, clientIp } from "@/lib/http";
import { acceptQuotation, loadDocument } from "@/lib/billing/documents";

export const POST = route<{ id: string }>({ roles: BILLING_ROLES }, async (req, { params, user }) => {
  const { record } = await loadDocument("quotation", params.id);
  const updated = await acceptQuotation(record, `Marked by admin (${user?.email || "admin"})`, clientIp(req));
  return message("Quotation marked as accepted", updated);
});
