import { prisma } from "@/lib/db";
import { BILLING_ROLES } from "@/lib/auth";
import { AppError, assertId, jsonBody, message, ok, route } from "@/lib/http";
import { buildAmounts } from "@/lib/billing/amounts";
import { round2 } from "@/lib/billing/calc";
import { computePaymentStatus } from "@/lib/billing/status";
import { invoiceDocumentSchema } from "@/lib/billing/validators";

export const GET = route<{ id: string }>({ roles: BILLING_ROLES }, async (_req, { params }) => {
  assertId(params.id, "Invoice");
  const invoice = await prisma.invoice.findUnique({ where: { id: params.id }, include: { quotation: true } });
  if (!invoice) throw new AppError("Invoice not found", 404);
  return ok(invoice);
});

export const PUT = route<{ id: string }>({ roles: BILLING_ROLES }, async (req, { params }) => {
  assertId(params.id, "Invoice");
  const existing = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!existing) throw new AppError("Invoice not found", 404);
  if (existing.paymentStatus === "CANCELLED") throw new AppError("A cancelled invoice cannot be edited", 400);

  const body = invoiceDocumentSchema.parse(await jsonBody(req));
  const { data } = await buildAmounts(body, existing.companyId);
  const paid = Number(existing.amountPaid || 0);
  if (data.totalAmount + 0.005 < paid) {
    throw new AppError(`The new total is less than the ${paid.toLocaleString("en-IN")} already received.`, 400);
  }
  const issueDate = body.issueDate || existing.issueDate;
  const dueDate = body.dueDate || existing.dueDate;
  if (dueDate < issueDate) throw new AppError("Due date cannot be before the invoice date", 400);

  const invoice = await prisma.invoice.update({
    where: { id: existing.id },
    data: {
      ...data,
      clientId: body.clientId,
      poNumber: body.poNumber,
      bankAccountId: body.bankAccountId,
      clientName: body.clientName,
      clientCompany: body.clientCompany,
      clientEmail: body.clientEmail,
      clientPhone: body.clientPhone,
      clientGst: body.clientGst,
      billingAddress: body.billingAddress,
      issueDate,
      dueDate,
      isDraft: body.isDraft,
      balanceDue: round2(data.totalAmount - paid),
      paymentStatus: computePaymentStatus(data.totalAmount, paid, dueDate, body.isDraft),
      termsAndConditions: body.termsAndConditions,
      notes: body.notes,
    },
  });
  return ok(invoice);
});

export const DELETE = route<{ id: string }>({ roles: BILLING_ROLES }, async (_req, { params }) => {
  assertId(params.id, "Invoice");
  const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (Number(invoice.amountPaid || 0) > 0) {
    throw new AppError("This invoice has payments recorded, so it cannot be deleted. Cancel it instead if it was raised in error.", 400);
  }
  await prisma.invoice.delete({ where: { id: invoice.id } });
  // Let the quotation be converted again.
  if (invoice.quotationId) {
    const remaining = await prisma.invoice.count({ where: { quotationId: invoice.quotationId } });
    if (!remaining) {
      await prisma.quotation.updateMany({ where: { id: invoice.quotationId, status: "CONVERTED" }, data: { status: "ACCEPTED" } }).catch(() => null);
    }
  }
  return message("Invoice deleted successfully");
});
