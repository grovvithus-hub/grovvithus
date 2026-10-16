import { prisma } from "@/lib/db";
import { BILLING_ROLES } from "@/lib/auth";
import { AppError, assertId, ok, route } from "@/lib/http";

export const POST = route<{ id: string }>({ roles: BILLING_ROLES }, async (_req, { params }) => {
  assertId(params.id, "Invoice");
  const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (Number(invoice.amountPaid || 0) > 0) {
    throw new AppError("This invoice has payments recorded, so it cannot be cancelled.", 400);
  }
  return ok(await prisma.invoice.update({ where: { id: invoice.id }, data: { paymentStatus: "CANCELLED", balanceDue: 0 } }));
});
