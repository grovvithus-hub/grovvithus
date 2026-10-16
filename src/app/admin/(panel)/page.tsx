import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { refreshDocumentStatuses } from "@/lib/billing/status";
import { inr, fmtDate } from "@/lib/billing/format";
import { PageHeader, StatCard } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  // Money figures are only for people who work with billing; editors get a shortcut to the portfolio.
  if (user.role !== "SUPER_ADMIN" && user.role !== "SALES") {
    return (
      <>
        <PageHeader title={`Welcome, ${user.name}`} subtitle="Manage the projects shown on the public website." />
        <Link href="/admin/portfolio" className="inline-flex rounded-full bg-lime px-6 py-3 text-sm font-bold text-ink">Open the portfolio</Link>
      </>
    );
  }
  await refreshDocumentStatuses();

  const [openQuotes, acceptedQuotes, unpaid, overdue, newLeads, notifications, recentInvoices] = await Promise.all([
    prisma.quotation.findMany({ where: { status: { in: ["DRAFT", "SENT", "VIEWED"] } }, select: { totalAmount: true } }),
    prisma.quotation.count({ where: { status: { in: ["ACCEPTED"] } } }),
    prisma.invoice.findMany({ where: { paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] }, isDraft: false }, select: { totalAmount: true, amountPaid: true } }),
    prisma.invoice.findMany({ where: { paymentStatus: "OVERDUE" }, select: { totalAmount: true, amountPaid: true } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.notification.findMany({ where: { userId: user.id, isRead: false }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, invoiceNumber: true, clientName: true, clientCompany: true, totalAmount: true, paymentStatus: true, dueDate: true } }),
  ]);

  const count = (n: number) => `${n} invoice${n === 1 ? "" : "s"}`;
  const sum = (rows: { totalAmount: number }[]) => rows.reduce((s, r) => s + r.totalAmount, 0);
  const due = (rows: { totalAmount: number; amountPaid: number }[]) => rows.reduce((s, r) => s + (r.totalAmount - r.amountPaid), 0);

  return (
    <>
      <PageHeader title={`Welcome, ${user.name}`} subtitle="Quotations, invoices, payments and new enquiries at a glance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="New leads" value={String(newLeads)} sub="waiting for a reply" />
        <StatCard label="Open quotations" value={String(openQuotes.length)} sub={inr(sum(openQuotes))} />
        <StatCard label="Accepted, not invoiced" value={String(acceptedQuotes)} sub="convert to invoice" />
        <StatCard label="Outstanding" value={inr(due(unpaid) + due(overdue))} sub={count(unpaid.length + overdue.length)} />
        <StatCard label="Overdue" value={inr(due(overdue))} sub={count(overdue.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Notifications</h2>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing new.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {notifications.map((n) => (
                <li key={n.id} className="py-2">
                  <div className="font-semibold text-slate-800">{n.title}</div>
                  <div className="text-slate-600">{n.message}</div>
                  <div className="text-xs text-slate-400">{fmtDate(n.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent invoices</h2>
            <Link href="/admin/invoices" className="text-xs font-semibold text-brand-600">
              View all
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-slate-500">No invoices yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {recentInvoices.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800">{i.invoiceNumber}</div>
                    <div className="truncate text-xs text-slate-500">{i.clientCompany || i.clientName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-800">{inr(i.totalAmount)}</div>
                    <div className="text-xs text-slate-500">{i.paymentStatus.replace("_", " ")} &middot; due {fmtDate(i.dueDate)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
