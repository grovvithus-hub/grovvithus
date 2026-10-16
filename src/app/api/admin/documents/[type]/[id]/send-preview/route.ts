import { BILLING_ROLES } from "@/lib/auth";
import { ok, route } from "@/lib/http";
import {
  documentFileName,
  emailDraft,
  ensureShareToken,
  kindFromParam,
  loadDocument,
  normalizeWhatsAppNumber,
  shareUrl,
  whatsappDraft,
} from "@/lib/billing/documents";
import { emailsEnabled } from "@/lib/mailer";

export const GET = route<{ type: string; id: string }>({ roles: BILLING_ROLES }, async (_req, { params }) => {
  const kind = kindFromParam(params.type);
  const { record, company, totals } = await loadDocument(kind, params.id);
  const link = shareUrl(await ensureShareToken(kind, record));
  return ok({
    email: emailDraft(kind, record, company, totals.totalAmount),
    whatsapp: {
      phone: normalizeWhatsAppNumber(record.clientPhone) ? record.clientPhone : "",
      message: whatsappDraft(kind, record, company, totals.totalAmount, link),
    },
    shareUrl: link,
    companyName: company.name,
    fileName: documentFileName(kind, record),
    emailsEnabled: emailsEnabled(),
  });
});
