import { prisma } from "@/lib/db";
import { BILLING_ROLES } from "@/lib/auth";
import { ok, route } from "@/lib/http";
import { buildAmounts } from "@/lib/billing/amounts";
import { nextDocumentNumber } from "@/lib/billing/numbers";
import { refreshDocumentStatuses } from "@/lib/billing/status";
import { quotationDocumentSchema } from "@/lib/billing/validators";
import { jsonBody } from "@/lib/http";

export const GET = route({ roles: BILLING_ROLES }, async (req) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search")?.trim();

  await refreshDocumentStatuses();

  const quotations = await prisma.quotation.findMany({
    where: {
      ...(status && status !== "ALL" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { quotationNumber: { contains: search } },
              { clientName: { contains: search } },
              { clientEmail: { contains: search } },
              { clientCompany: { contains: search } },
              { poNumber: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      lead: { select: { id: true, leadNumber: true, clientName: true } },
      invoices: { select: { id: true, invoiceNumber: true, paymentStatus: true, totalAmount: true } },
    },
  });
  return ok(quotations);
});

export const POST = route({ roles: BILLING_ROLES }, async (req) => {
  const body = quotationDocumentSchema.parse(await jsonBody(req));
  const { company, data } = await buildAmounts(body);

  const quotation = await prisma.quotation.create({
    data: {
      ...data,
      quotationNumber: await nextDocumentNumber("QUO"),
      leadId: body.leadId || undefined,
      clientId: body.clientId || undefined,
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
      termsAndConditions: body.termsAndConditions ?? company.quotationTerms,
      notes: body.notes ?? company.defaultNotes,
      status: "DRAFT",
    },
  });

  if (body.leadId) {
    await prisma.lead.update({ where: { id: body.leadId }, data: { status: "PROPOSAL_SENT" } }).catch(() => null);
  }
  return ok(quotation, 201);
});
