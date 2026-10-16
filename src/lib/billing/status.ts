import { prisma } from "@/lib/db";
import { round2 } from "./calc";

export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const computePaymentStatus = (
  total: number,
  paid: number,
  dueDate: Date | null,
  isDraft: boolean,
): PaymentStatus => {
  const balance = round2(total - paid);
  if (balance <= 0) return "PAID"; // includes zero-value invoices
  if (!isDraft && dueDate && dueDate < startOfToday()) return "OVERDUE";
  return paid > 0 ? "PARTIALLY_PAID" : "UNPAID";
};

/**
 * Marks quotations whose validity has passed as EXPIRED and unpaid invoices past their due date as OVERDUE.
 * Called when lists are opened and by the daily job (POST /api/cron/refresh-statuses), so dashboards stay current.
 */
export async function refreshDocumentStatuses() {
  const today = startOfToday();
  const [expired, overdue] = await Promise.all([
    prisma.quotation.updateMany({
      where: { status: { in: ["SENT", "VIEWED"] }, validUntil: { lt: today } },
      data: { status: "EXPIRED" },
    }),
    prisma.invoice.updateMany({
      where: { paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] }, isDraft: false, dueDate: { lt: today } },
      data: { paymentStatus: "OVERDUE" },
    }),
  ]);
  return { quotationsExpired: expired.count, invoicesOverdue: overdue.count };
}
