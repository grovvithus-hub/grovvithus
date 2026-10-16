import { prisma } from "@/lib/db";
import { BILLING_ROLES } from "@/lib/auth";
import { AppError, assertId, jsonBody, message, ok, route } from "@/lib/http";
import { buildAmounts } from "@/lib/billing/amounts";
import { startOfToday } from "@/lib/billing/status";
import { quotationDocumentSchema } from "@/lib/billing/validators";

export const GET = route<{ id: string }>({ roles: BILLING_ROLES }, async (_req, { params }) => {
  assertId(params.id, "Quotation");
  const quotation = await prisma.quotation.findUnique({ where: { id: params.id }, include: { lead: true, invoices: true } });
  if (!quotation) throw new AppError("Quotation not found", 404);
  return ok(quotation);
});

export const PUT = route<{ id: string }>({ roles: BILLING_ROLES }, async (req, { params }) => {
  assertId(params.id, "Quotation");
  const existing = await prisma.quotation.findUnique({ where: { id: params.id } });
  if (!existing) throw new AppError("Quotation not found", 404);
  if (existing.status === "CONVERTED") {
    throw new AppError("This quotation has been converted to an invoice. Edit the invoice instead.", 400);
  }

  const body = quotationDocumentSchema.parse(await jsonBody(req));
  const { data } = await buildAmounts(body, existing.companyId);

  const quotation = await prisma.quotation.update({
    where: { id: existing.id },
    data: {
      ...data,
      leadId: body.leadId ?? existing.leadId,
      clientId: body.clientId,
      poNumber: body.poNumber,
      bankAccountId: body.bankAccountId,
      title: body.title,
      clientName: body.clientName,
      clientCompany: body.clientCompany,
      clientEmail: body.clientEmail,
      clientPhone: body.clientPhone,
      clientAddress: body.clientAddress,
      clientGst: body.clientGst,
      validUntil: body.validUntil,
      termsAndConditions: body.termsAndConditions,
      notes: body.notes,
      // Re-opening an expired quotation with a new validity date moves it back to SENT.
      status: body.status ?? (existing.status === "EXPIRED" && body.validUntil && body.validUntil >= startOfToday() ? "SENT" : undefined),
    },
  });
  return ok(quotation);
});

export const DELETE = route<{ id: string }>({ roles: BILLING_ROLES }, async (_req, { params }) => {
  assertId(params.id, "Quotation");
  const existing = await prisma.quotation.findUnique({ where: { id: params.id }, include: { invoices: { select: { id: true } } } });
  if (!existing) throw new AppError("Quotation not found", 404);
  if (existing.invoices.length) {
    throw new AppError("This quotation has an invoice. Delete or cancel the invoice first.", 400);
  }
  await prisma.quotation.delete({ where: { id: existing.id } });
  return message("Quotation deleted successfully");
});
