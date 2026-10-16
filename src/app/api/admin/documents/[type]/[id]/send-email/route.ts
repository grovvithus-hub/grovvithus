import { z } from "zod";
import { BILLING_ROLES } from "@/lib/auth";
import { AppError, jsonBody, message, route } from "@/lib/http";
import { emailDraft, kindFromParam, loadDocument, sendDocumentEmail } from "@/lib/billing/documents";
import { sendEmailSchema } from "@/lib/billing/validators";

export const POST = route<{ type: string; id: string }>({ roles: BILLING_ROLES }, async (req, { params }) => {
  const kind = kindFromParam(params.type);
  const raw = await jsonBody(req);
  const body = sendEmailSchema.parse(raw);

  // Missing fields fall back to the prepared draft, so a bare POST is a one-click send.
  const { record, company, totals } = await loadDocument(kind, params.id);
  const draft = emailDraft(kind, record, company, totals.totalAmount);
  const to = body.to || draft.to;
  if (!to || !z.string().email().safeParse(to).success) {
    throw new AppError("The client has no valid email address. Add one and try again.", 400);
  }

  const result = await sendDocumentEmail(kind, record.id, {
    to,
    cc: raw.cc === undefined ? draft.cc : (body.cc ?? []),
    subject: body.subject || draft.subject,
    message: body.message || draft.message,
    attachPdf: body.attachPdf,
    includeLink: body.includeLink,
  });

  if (!result.sent) {
    return Response.json({ status: "fail", message: result.error || "Email could not be sent" }, { status: 502 });
  }
  return message(`Email sent to ${to}`);
});
