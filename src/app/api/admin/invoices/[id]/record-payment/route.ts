import { prisma } from "@/lib/db";
import { BILLING_ROLES } from "@/lib/auth";
import { AppError, assertId, jsonBody, ok, route } from "@/lib/http";
import { round2 } from "@/lib/billing/calc";
import { computePaymentStatus } from "@/lib/billing/status";
import { recordPaymentSchema } from "@/lib/billing/validators";

export const POST = route<{ id: string }>({ roles: BILLING_ROLES }, async (req, { params, user }) => {
  assertId(params.id, "Invoice");
  const body = recordPaymentSchema.parse(await jsonBody(req));
  const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (invoice.paymentStatus === "CANCELLED") throw new AppError("This invoice is cancelled", 400);

  const balance = round2(Number(invoice.totalAmount) - Number(invoice.amountPaid || 0));
  if (balance <= 0) throw new AppError("This invoice is already fully paid", 400);
  const amount = round2(body.paymentAmount);
  if (amount > balance + 0.005) {
    throw new AppError(`Payment is more than the balance due (${balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })})`, 400);
  }

  const newPaid = round2(Number(invoice.amountPaid || 0) + amount);
  const payments = [
    ...(Array.isArray(invoice.payments) ? (invoice.payments as unknown[]) : []),
    {
      amount,
      method: body.paymentMethod,
      reference: body.paymentReference,
      date: body.paymentDate || new Date(),
      notes: body.notes,
      recordedAt: new Date(),
      recordedBy: user?.email || null,
    },
  ];

  // Only apply when nobody else recorded a payment in the meantime (prevents lost updates and double entries).
  const claim = await prisma.invoice.updateMany({
    where: { id: invoice.id, amountPaid: invoice.amountPaid, paymentStatus: { not: "CANCELLED" } },
    data: {
      amountPaid: newPaid,
      balanceDue: round2(Number(invoice.totalAmount) - newPaid),
      paymentStatus: computePaymentStatus(Number(invoice.totalAmount), newPaid, invoice.dueDate, false),
      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentReference ?? invoice.paymentReference,
      payments: payments as never,
      isDraft: false,
    },
  });
  if (claim.count === 0) throw new AppError("This invoice was just updated by someone else. Refresh and try again.", 409);

  return ok(await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } }));
});
