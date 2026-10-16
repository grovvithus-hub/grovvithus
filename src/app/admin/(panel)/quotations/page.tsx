"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRightLeft,
  Ban,
  CheckCircle2,
  Download,
  Edit2,
  Eye,
  FileText,
  History,
  Link2,
  Mail,
  MessageSquare,
  Plus,
  Printer,
  Receipt,
  Search,
  Trash2,
} from "lucide-react";
import { api, apiRaw, copyToClipboard, downloadPdf, errorMessage, openPdf, printPdf } from "@/components/billing/api";
import { DocumentEditor, type EditorInitial, type SaveAction } from "@/components/billing/DocumentEditor";
import { SendDocumentDialog, type SendTab } from "@/components/billing/SendDocumentDialog";
import { DocumentActivityDialog } from "@/components/billing/DocumentActivityDialog";
import type { Lead, Quotation } from "@/components/billing/types";
import { useDialog } from "@/components/ui/DialogProvider";
import { IconButton, PageHeader, RowMenu, Spinner, StatCard, StatusBadge, Button } from "@/components/ui/kit";
import { fmtDate, inr } from "@/lib/billing/format";

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-slate-500/10 text-slate-600" },
  SENT: { label: "Sent", cls: "bg-blue-500/10 text-blue-700" },
  VIEWED: { label: "Viewed", cls: "bg-amber-500/10 text-amber-700" },
  ACCEPTED: { label: "Accepted", cls: "bg-lime/25 text-brand-600" },
  CONVERTED: { label: "Invoiced", cls: "bg-indigo-500/10 text-indigo-700" },
  DECLINED: { label: "Declined", cls: "bg-rose-500/10 text-rose-700" },
  EXPIRED: { label: "Expired", cls: "bg-orange-500/10 text-orange-700" },
};

function QuotationsView() {
  const router = useRouter();
  const params = useSearchParams();
  const { confirm, alert } = useDialog();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [editor, setEditor] = useState<{ initial: EditorInitial | null } | null>(null);
  const [sendDialog, setSendDialog] = useState<{ id: string; label: string; tab: SendTab } | null>(null);
  const [activity, setActivity] = useState<{ id: string; label: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams({ status: statusFilter });
      if (search) qs.set("search", search);
      setQuotations(await api<Quotation[]>(`/api/admin/quotations?${qs}`));
    } catch (err) {
      console.error("Failed to load quotations:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  // Opened from a lead ("Create quotation")
  const fromLead = params.get("fromLead");
  useEffect(() => {
    if (!fromLead) return;
    api<Lead>(`/api/admin/leads/${fromLead}`)
      .then((lead) =>
        setEditor({
          initial: {
            leadId: lead.id,
            clientName: lead.clientName,
            clientCompany: lead.companyName || "",
            clientEmail: lead.email,
            clientPhone: lead.phone,
            title: lead.serviceOfInterest ? `${lead.serviceOfInterest} Proposal` : "",
          },
        }),
      )
      .catch(() => null);
    router.replace("/admin/quotations");
  }, [fromLead, router]);

  const label = (q: Quotation) => `Quotation ${q.quotationNumber}`;

  const run = async (fn: () => Promise<unknown>, failTitle: string) => {
    try {
      await fn();
    } catch (err) {
      await alert({ title: failTitle, message: errorMessage(err), variant: "error" });
    }
  };

  const handleSaved = (doc: { id: string; quotationNumber?: string }, action: SaveAction) => {
    load();
    if (action === "new") return;
    setEditor(null);
    if (action === "send") setSendDialog({ id: doc.id, label: `Quotation ${doc.quotationNumber}`, tab: "email" });
  };

  const handleCopyLink = (q: Quotation) =>
    run(async () => {
      const { url } = await api<{ url: string }>(`/api/admin/documents/quotations/${q.id}/share-link`, { body: {} });
      await copyToClipboard(url);
      await alert({ title: "Link copied", message: `Client link for ${q.quotationNumber} copied:\n${url}`, variant: "success" });
    }, "Could not get the link");

  const handleAccept = async (q: Quotation) => {
    if (await confirm({ title: "Mark as accepted", message: `Mark ${q.quotationNumber} for ${q.clientCompany || q.clientName} as accepted by the client?`, confirmText: "Mark accepted" }))
      await run(async () => {
        await api(`/api/admin/quotations/${q.id}/accept`, { body: {} });
        load();
      }, "Could not update the quotation");
  };

  const handleConvert = async (q: Quotation) => {
    const ok = await confirm({
      title: "Create invoice",
      message: `Create an invoice from ${q.quotationNumber} (${inr(q.totalAmount)})? Items, client details and GST are copied, and you can edit it before sending.`,
      confirmText: "Create invoice",
    });
    if (!ok) return;
    await run(async () => {
      const res = await apiRaw(`/api/admin/quotations/${q.id}/convert`, { body: {} });
      load();
      const goThere = await confirm({ title: "Invoice ready", message: `${res.message}. Open Invoices now?`, confirmText: "Open invoices", variant: "success" });
      if (goThere) router.push("/admin/invoices");
    }, "Could not create the invoice");
  };

  const handleDecline = async (q: Quotation) => {
    if (await confirm({ title: "Mark as declined", message: `Mark ${q.quotationNumber} as declined by the client?`, confirmText: "Mark declined", variant: "warning" }))
      await run(async () => {
        await api(`/api/admin/quotations/${q.id}`, { method: "PUT", body: { ...q, status: "DECLINED", validUntil: q.validUntil } });
        load();
      }, "Could not update the quotation");
  };

  const handleDelete = async (q: Quotation) => {
    if (await confirm({ title: "Delete quotation", message: `Permanently delete ${q.quotationNumber}? Links already shared with the client will stop working.`, confirmText: "Delete", variant: "danger" }))
      await run(async () => {
        await api(`/api/admin/quotations/${q.id}`, { method: "DELETE" });
        load();
      }, "Could not delete");
  };

  const openList = quotations.filter((q) => ["DRAFT", "SENT", "VIEWED"].includes(q.status));
  const won = quotations.filter((q) => ["ACCEPTED", "CONVERTED"].includes(q.status));
  const sum = (list: Quotation[]) => list.reduce((s, q) => s + Number(q.totalAmount || 0), 0);

  return (
    <>
      <PageHeader
        title="Quotations"
        subtitle="Create GST quotations, send them by email or WhatsApp, see when clients view and accept them, and convert them to invoices."
        action={
          <Button onClick={() => setEditor({ initial: null })} className="bg-white !text-ink hover:!bg-lime-soft">
            <Plus className="h-4 w-4" /> Create quotation
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open quotations" value={String(openList.length)} sub={inr(sum(openList))} />
        <StatCard label="Viewed by client" value={String(quotations.filter((q) => q.viewedAt).length)} sub="opened the link" />
        <StatCard label="Accepted / invoiced" value={String(won.length)} sub={inr(sum(won))} />
        <StatCard label="Win rate" value={`${quotations.length ? Math.round((won.length / quotations.length) * 100) : 0}%`} sub={`of ${quotations.length} shown`} />
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row">
        <div className="relative w-full flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by quote #, client, email, company or PO…"
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

      {loading && quotations.length === 0 ? (
        <div className="flex justify-center py-20 text-brand-600">
          <Spinner className="h-8 w-8" />
        </div>
      ) : quotations.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="text-base font-bold text-slate-900">No quotations found</h3>
          <p className="mt-1 text-xs text-slate-400">Create your first quotation, or start one from a lead.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Quote #</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent / viewed</th>
                  <th className="px-4 py-3">Valid until</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {quotations.map((q) => {
                  const cfg = STATUS[q.status] || STATUS.DRAFT;
                  const invoice = q.invoices?.[0];
                  const canAccept = ["DRAFT", "SENT", "VIEWED"].includes(q.status);
                  const canConvert = !["CONVERTED", "DECLINED", "EXPIRED"].includes(q.status) && !invoice;
                  return (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="whitespace-nowrap font-mono text-xs font-bold text-brand-600">{q.quotationNumber}</div>
                        <div className="text-[11px] text-slate-400">{fmtDate(q.createdAt)}</div>
                      </td>
                      <td className="max-w-[240px] px-4 py-3">
                        <div className="truncate font-semibold text-slate-900">{q.clientCompany || q.clientName}</div>
                        <div className="truncate text-xs text-slate-400">{q.title || (q.clientCompany ? q.clientName : q.clientEmail)}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">
                        {inr(q.totalAmount)}
                        <span className="block text-[11px] font-normal text-slate-400">
                          incl. {inr(q.taxAmount)} {q.taxType === "IGST" ? "IGST" : "GST"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge {...cfg} />
                        {invoice && <div className="mt-1 text-[11px] text-indigo-600">{invoice.invoiceNumber}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${q.sentViaEmail ? "bg-lime/25 text-brand-600" : "bg-slate-100 text-slate-400"}`}>Email</span>
                          <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${q.sentViaWhatsApp ? "bg-lime/25 text-brand-600" : "bg-slate-100 text-slate-400"}`}>WhatsApp</span>
                        </div>
                        {q.viewedAt && (
                          <div className="mt-1 text-[11px] text-amber-700">
                            Viewed {q.viewCount > 1 ? `${q.viewCount}× · ` : ""}first {fmtDate(q.viewedAt)}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">{q.validUntil ? fmtDate(q.validUntil) : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton title="View PDF" icon={Eye} onClick={() => run(() => openPdf("quotations", q.id), "Could not open the PDF")} />
                          <IconButton title="Download PDF" icon={Download} onClick={() => run(() => downloadPdf("quotations", q.id, `Quotation_${q.quotationNumber}`), "Could not download the PDF")} />
                          <IconButton title="Send by email" icon={Mail} className="text-blue-600" onClick={() => setSendDialog({ id: q.id, label: label(q), tab: "email" })} />
                          <IconButton title="Send on WhatsApp" icon={MessageSquare} className="text-brand-600" onClick={() => setSendDialog({ id: q.id, label: label(q), tab: "whatsapp" })} />
                          {canConvert && (
                            <button onClick={() => handleConvert(q)} className="whitespace-nowrap rounded bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-lime-soft" title="Create an invoice from this quotation">
                              &rarr; Invoice
                            </button>
                          )}
                          <RowMenu
                            items={[
                              { label: "Print", icon: Printer, onClick: () => run(() => printPdf("quotations", q.id), "Could not print") },
                              { label: "Copy client link", icon: Link2, onClick: () => handleCopyLink(q) },
                              { label: "History", icon: History, onClick: () => setActivity({ id: q.id, label: q.quotationNumber }) },
                              { label: "Edit", icon: Edit2, onClick: () => setEditor({ initial: q as EditorInitial }), hidden: q.status === "CONVERTED" },
                              { label: "Mark accepted", icon: CheckCircle2, onClick: () => handleAccept(q), hidden: !canAccept },
                              { label: "Create invoice", icon: ArrowRightLeft, onClick: () => handleConvert(q), hidden: !canConvert },
                              { label: "Open invoices", icon: Receipt, onClick: () => router.push("/admin/invoices"), hidden: !invoice },
                              { label: "Mark declined", icon: Ban, onClick: () => handleDecline(q), hidden: !canAccept },
                              { label: "Delete", icon: Trash2, onClick: () => handleDelete(q), danger: true },
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

      {editor && <DocumentEditor kind="quotation" initial={editor.initial} onClose={() => setEditor(null)} onSaved={handleSaved as never} />}
      {sendDialog && <SendDocumentDialog type="quotations" id={sendDialog.id} label={sendDialog.label} initialTab={sendDialog.tab} onClose={() => setSendDialog(null)} onSent={load} />}
      {activity && <DocumentActivityDialog type="quotations" id={activity.id} label={activity.label} onClose={() => setActivity(null)} />}
    </>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense>
      <QuotationsView />
    </Suspense>
  );
}
