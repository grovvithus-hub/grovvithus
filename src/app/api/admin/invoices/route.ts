import { prisma } from "@/lib/db";
import { like } from "@/lib/dbsearch";
import { BILLING_ROLES } from "@/lib/auth";
import { AppError, jsonBody, ok, route } from "@/lib/http";
import { buildAmounts } from "@/lib/billing/amounts";
import { round2 } from "@/lib/billing/calc";
import { nextDocumentNumber } from "@/lib/billing/numbers";
import { computePaymentStatus, refreshDocumentStatuses } from "@/lib/billing/status";
import { invoiceDocumentSchema } from "@/lib/billing/validators";

export const GET = route({ roles: BILLING_ROLES }, async (req) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search")?.trim();

  await refreshDocumentStatuses();

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(status === "DRAFT" ? { isDraft: true } : status && status !== "ALL" ? { paymentStatus: status } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: like(search) },
              { clientName: like(search) },
              { clientEmail: like(search) },
              { clientCompany: like(search) },
              { poNumber: like(search) },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { quotation: { select: { id: true, quotationNumber: true } } },
  });
  return ok(invoices);
});

export const POST = route({ roles: BILLING_ROLES }, async (req) => {
  const body = invoiceDocumentSchema.parse(await jsonBody(req));
  const { company, data } = await buildAmounts(body);

  const issueDate = body.issueDate || new Date();
  const dueDate = body.dueDate || new Date(issueDate.getTime() + 15 * 24 * 60 * 60 * 1000);
  if (dueDate < issueDate) throw new AppError("Due date cannot be before the invoice date", 400);

  const paid = round2(Math.min(body.amountPaid, data.totalAmount));
  const payments =
    paid > 0
      ? [
          {
            amount: paid,
            method: body.paymentMethod || "BANK_TRANSFER",
            reference: body.paymentReference || null,
            date: issueDate,
            notes: "Recorded when the invoice was created",
            recordedAt: new Date(),
          },
        ]
      : [];

  const invoice = await prisma.invoice.create({
    data: {
      ...data,
      invoiceNumber: await nextDocumentNumber("INV"),
      quotationId: body.quotationId || undefined,
      clientId: body.clientId || undefined,
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
      amountPaid: paid,
      balanceDue: round2(data.totalAmount - paid),
      paymentStatus: computePaymentStatus(data.totalAmount, paid, dueDate, body.isDraft),
      paymentMethod: paid > 0 ? body.paymentMethod || "BANK_TRANSFER" : undefined,
      paymentReference: paid > 0 ? body.paymentReference : undefined,
      payments: payments as never,
      termsAndConditions: body.termsAndConditions ?? company.invoiceTerms,
      notes: body.notes ?? company.defaultNotes,
    },
  });

  if (body.quotationId) {
    await prisma.quotation
      .updateMany({ where: { id: body.quotationId, status: { notIn: ["DECLINED", "EXPIRED"] } }, data: { status: "CONVERTED" } })
      .catch(() => null);
  }
  return ok(invoice, 201);
});
