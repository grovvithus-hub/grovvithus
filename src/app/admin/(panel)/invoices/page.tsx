"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Download, Edit2, Eye, FileText, History, IndianRupee, Link2, Mail, MessageSquare, Plus, Printer, Search, Trash2 } from "lucide-react";
import { api, copyToClipboard, downloadPdf, errorMessage, openPdf, printPdf } from "@/components/billing/api";
import { DocumentEditor, type EditorInitial, type SaveAction } from "@/components/billing/DocumentEditor";
import { SendDocumentDialog, type SendTab } from "@/components/billing/SendDocumentDialog";
import { DocumentActivityDialog } from "@/components/billing/DocumentActivityDialog";
import { RecordPaymentDialog } from "@/components/billing/RecordPaymentDialog";
import type { Invoice } from "@/components/billing/types";
import { useDialog } from "@/components/ui/DialogProvider";
import { Button, IconButton, PageHeader, RowMenu, Spinner, StatCard, StatusBadge } from "@/components/ui/kit";
import { fmtDate, inr } from "@/lib/billing/format";

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-slate-500/10 text-slate-600" },
  UNPAID: { label: "Unpaid", cls: "bg-amber-500/10 text-amber-700" },
  PARTIALLY_PAID: { label: "Partly paid", cls: "bg-blue-500/10 text-blue-700" },
  OVERDUE: { label: "Overdue", cls: "bg-rose-500/10 text-rose-700" },
  PAID: { label: "Paid", cls: "bg-lime/25 text-brand-600" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-500/10 text-slate-500 line-through" },
};

export default function InvoicesPage() {
  const { confirm, alert } = useDialog();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [editor, setEditor] = useState<{ initial: EditorInitial | null } | null>(null);
  const [sendDialog, setSendDialog] = useState<{ id: string; label: string; tab: SendTab } | null>(null);
  const [activity, setActivity] = useState<{ id: string; label: string } | null>(null);
  const [paymentFor, setPaymentFor] = useState<Invoice | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams({ status: statusFilter });
      if (search) qs.set("search", search);
      setInvoices(await api<Invoice[]>(`/api/admin/invoices?${qs}`));
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const statusOf = (inv: Invoice) => (inv.isDraft && inv.paymentStatus !== "CANCELLED" ? "DRAFT" : inv.paymentStatus);
  const label = (inv: { invoiceNumber: string }) => `Invoice ${inv.invoiceNumber}`;

  const run = async (fn: () => Promise<unknown>, failTitle: string) => {
    try {
      await fn();
    } catch (err) {
      await alert({ title: failTitle, message: errorMessage(err), variant: "error" });
    }
  };

  const handleSaved = (doc: { id: string; invoiceNumber?: string }, action: SaveAction) => {
    load();
    if (action === "new") return;
    setEditor(null);
    if (action === "send") setSendDialog({ id: doc.id, label: `Invoice ${doc.invoiceNumber}`, tab: "email" });
  };

  const handleCopyLink = (inv: Invoice) =>
    run(async () => {
      const { url } = await api<{ url: string }>(`/api/admin/documents/invoices/${inv.id}/share-link`, { body: {} });
      await copyToClipboard(url);
      await alert({ title: "Link copied", message: `Client link for ${inv.invoiceNumber} copied:\n${url}`, variant: "success" });
    }, "Could not get the link");

  const handleCancel = async (inv: Invoice) => {
    if (await confirm({ title: "Cancel invoice", message: `Cancel ${inv.invoiceNumber}? It stays on record as cancelled and no payment can be added.`, confirmText: "Cancel invoice", variant: "warning" }))
      await run(async () => {
        await api(`/api/admin/invoices/${inv.id}/cancel`, { body: {} });
        load();
      }, "Could not cancel the invoice");
  };

  const handleDelete = async (inv: Invoice) => {
    if (await confirm({ title: "Delete invoice", message: `Permanently delete ${inv.invoiceNumber}? Links already shared with the client will stop working.`, confirmText: "Delete", variant: "danger" }))
      await run(async () => {
        await api(`/api/admin/invoices/${inv.id}`, { method: "DELETE" });
        load();
      }, "Could not delete");
  };

  const live = invoices.filter((i) => !["CANCELLED"].includes(i.paymentStatus) && !i.isDraft);
  const outstanding = live.filter((i) => i.paymentStatus !== "PAID");
  const sumBalance = (list: Invoice[]) => list.reduce((s, i) => s + (Number(i.totalAmount) - Number(i.amountPaid || 0)), 0);
  const overdue = invoices.filter((i) => i.paymentStatus === "OVERDUE");
  const paid = live.filter((i) => i.paymentStatus === "PAID");

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Raise GST tax invoices, send them with a UPI QR code, record payments and keep track of what is overdue."
        action={
          <Button onClick={() => setEditor({ initial: null })} className="bg-white !text-ink hover:!bg-lime-soft">
            <Plus className="h-4 w-4" /> Create invoice
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Outstanding" value={inr(sumBalance(outstanding))} sub={`${outstanding.length} invoice${outstanding.length === 1 ? "" : "s"}`} />
        <StatCard label="Overdue" value={inr(sumBalance(overdue))} sub={`${overdue.length} invoice${overdue.length === 1 ? "" : "s"}`} />
        <StatCard label="Paid" value={String(paid.length)} sub={inr(paid.reduce((s, i) => s + Number(i.totalAmount), 0))} />
        <StatCard label="Drafts" value={String(invoices.filter((i) => i.isDraft).length)} sub="not sent yet" />
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row">
        <div className="relative w-full flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, client, email, company or PO…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <option value="ALL">All statuses</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {loading && invoices.length === 0 ? (
        <div className="flex justify-center py-20 text-brand-600">
          <Spinner className="h-8 w-8" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="text-base font-bold text-slate-900">No invoices found</h3>
          <p className="mt-1 text-xs text-slate-400">Create an invoice, or convert an accepted quotation.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {invoices.map((inv) => {
                  const cfg = STATUS[statusOf(inv)] || STATUS.UNPAID;
                  const cancelled = inv.paymentStatus === "CANCELLED";
                  const balance = cancelled ? 0 : Math.max(0, Number(inv.totalAmount) - Number(inv.amountPaid || 0));
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="whitespace-nowrap font-mono text-xs font-bold text-brand-600">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-400">
                          {fmtDate(inv.issueDate)}
                          {inv.quotation ? ` · from ${inv.quotation.quotationNumber}` : ""}
                        </div>
                      </td>
                      <td className="max-w-[240px] px-4 py-3">
                        <div className="truncate font-semibold text-slate-900">{inv.clientCompany || inv.clientName}</div>
                        <div className="truncate text-xs text-slate-400">{inv.clientCompany ? inv.clientName : inv.clientEmail}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">{inr(inv.totalAmount)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={balance > 0 ? "font-semibold text-amber-700" : "text-slate-400"}>{inr(balance)}</span>
                        {Number(inv.amountPaid) > 0 && balance > 0 && <span className="block text-[11px] text-slate-400">{inr(inv.amountPaid)} received</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge {...cfg} />
                        <div className="mt-1 flex gap-1 text-[11px]">
                          {inv.sentViaEmail && <span className="text-brand-600">Emailed</span>}
                          {inv.sentViaWhatsApp && <span className="text-brand-600">WhatsApp</span>}
                          {inv.viewedAt && <span className="text-amber-700">Viewed</span>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">{fmtDate(inv.dueDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton title="View PDF" icon={Eye} onClick={() => run(() => openPdf("invoices", inv.id), "Could not open the PDF")} />
                          <IconButton title="Download PDF" icon={Download} onClick={() => run(() => downloadPdf("invoices", inv.id, `Invoice_${inv.invoiceNumber}`), "Could not download the PDF")} />
                          <IconButton title="Send by email" icon={Mail} className="text-blue-600" onClick={() => setSendDialog({ id: inv.id, label: label(inv), tab: "email" })} />
                          <IconButton title="Send on WhatsApp" icon={MessageSquare} className="text-brand-600" onClick={() => setSendDialog({ id: inv.id, label: label(inv), tab: "whatsapp" })} />
                          {balance > 0 && !cancelled && (
                            <IconButton title="Record a payment received" icon={IndianRupee} className="text-brand-600" onClick={() => setPaymentFor(inv)} />
                          )}
                          <RowMenu
                            items={[
                              { label: "Print", icon: Printer, onClick: () => run(() => printPdf("invoices", inv.id), "Could not print") },
                              { label: "Copy client link", icon: Link2, onClick: () => handleCopyLink(inv) },
                              { label: "History & payments", icon: History, onClick: () => setActivity({ id: inv.id, label: inv.invoiceNumber }) },
                              { label: "Record payment", icon: IndianRupee, onClick: () => setPaymentFor(inv), hidden: balance <= 0 || cancelled },
                              { label: "Edit", icon: Edit2, onClick: () => setEditor({ initial: inv as EditorInitial }), hidden: cancelled },
                              { label: "Cancel invoice", icon: Ban, onClick: () => handleCancel(inv), hidden: cancelled || Number(inv.amountPaid) > 0 },
                              { label: "Delete", icon: Trash2, onClick: () => handleDelete(inv), danger: true, hidden: Number(inv.amountPaid) > 0 },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editor && <DocumentEditor kind="invoice" initial={editor.initial} onClose={() => setEditor(null)} onSaved={handleSaved as never} />}
      {sendDialog && <SendDocumentDialog type="invoices" id={sendDialog.id} label={sendDialog.label} initialTab={sendDialog.tab} onClose={() => setSendDialog(null)} onSent={load} />}
      {activity && <DocumentActivityDialog type="invoices" id={activity.id} label={activity.label} onClose={() => setActivity(null)} />}
      {paymentFor && (
        <RecordPaymentDialog
          invoice={paymentFor}
          onClose={() => setPaymentFor(null)}
          onRecorded={(updated, sendReceipt) => {
            setPaymentFor(null);
            load();
            if (sendReceipt) setSendDialog({ id: updated.id, label: label(updated), tab: "email" });
          }}
        />
      )}
    </>
  );
}
