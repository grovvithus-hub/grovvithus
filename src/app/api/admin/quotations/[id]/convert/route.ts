import { BILLING_ROLES } from "@/lib/auth";
import { message, route } from "@/lib/http";
import { convertQuotationToInvoice } from "@/lib/billing/documents";

export const POST = route<{ id: string }>({ roles: BILLING_ROLES }, async (_req, { params }) => {
  const { invoice, created } = await convertQuotationToInvoice(params.id);
  return message(
    created ? `Invoice ${invoice.invoiceNumber} created` : `This quotation was already converted to invoice ${invoice.invoiceNumber}`,
    invoice,
    created ? 201 : 200,
  );
});
