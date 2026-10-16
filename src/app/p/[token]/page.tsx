"use client";

/* eslint-disable @next/next/no-img-element */
import { use, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Landmark, Loader2, MessageCircle, Printer, Smartphone } from "lucide-react";
import { apiRaw, errorMessage } from "@/components/billing/api";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { fmtDate, inr } from "@/lib/billing/format";
import type { BillingLine } from "@/lib/billing/calc";

interface PublicDoc {
  kind: "quotation" | "invoice";
  number: string;
  title: string;
  status: string;
  date: string;
  dueDate: string | null;
  validUntil: string | null;
  poNumber: string | null;
  acceptedAt: string | null;
  acceptedBy: string | null;
  canAccept: boolean;
  client: { name: string; company: string | null; address: string | null; gstin: string | null };
  company: {
    name: string; addressLines: string[]; gstin: string | null; email: string | null; phone: string | null; logoDataUrl: string | null;
    bankAccountName: string | null; bankName: string | null; bankAccountNumber: string | null; bankIfsc: string | null; bankBranch: string | null; upiId: string | null;
  };
  items: BillingLine[];
  totals: {
    subTotal: number; discountAmount: number; taxableAmount: number; taxType: "CGST_SGST" | "IGST"; cgstAmount: number; sgstAmount: number; igstAmount: number;
    additionalCharges: number; additionalChargesLabel: string | null; totalAmount: number; amountInWords: string; placeOfSupply: string | null; amountPaid: number; balanceDue: number;
  };
  upiUri: string | null;
  upiQrDataUrl: string | null;
  termsAndConditions: string | null;
  notes: string | null;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-700" },
  SENT: { label: "Awaiting your response", cls: "bg-blue-100 text-blue-800" },
  VIEWED: { label: "Awaiting your response", cls: "bg-blue-100 text-blue-800" },
  ACCEPTED: { label: "Accepted", cls: "bg-lime text-ink" },
  CONVERTED: { label: "Accepted", cls: "bg-lime text-ink" },
  DECLINED: { label: "Declined", cls: "bg-rose-100 text-rose-800" },
  EXPIRED: { label: "Expired", cls: "bg-orange-100 text-orange-800" },
  UNPAID: { label: "Payment due", cls: "bg-amber-100 text-amber-800" },
  PARTIALLY_PAID: { label: "Partly paid", cls: "bg-amber-100 text-amber-800" },
  OVERDUE: { label: "Overdue", cls: "bg-rose-100 text-rose-800" },
  PAID: { label: "Paid", cls: "bg-lime text-ink" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-slate-600" },
};

export default function SharedDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [doc, setDoc] = useState<PublicDoc | null>(null);
  const [error, setError] = useState("");
  const [acceptName, setAcceptName] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");

  useEffect(() => {
    apiRaw(`/api/public/doc/${token}`)
      .then((r) => setDoc(r.data as PublicDoc))
      .catch((e) => setError(errorMessage(e, "This link is invalid or has expired")));
  }, [token]);

  const accept = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccepting(true);
    setAcceptError("");
    try {
      const r = await apiRaw(`/api/public/doc/${token}/accept`, { body: { name: acceptName } });
      setDoc(r.data as PublicDoc);
    } catch (err) {
      setAcceptError(errorMessage(err, "Could not accept. Please try again."));
    } finally {
      setAccepting(false);
    }
  };

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper p-6">
        <div className="max-w-md rounded-[20px] bg-white p-8 text-center shadow">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-rose-500" />
          <h1 className="font-display text-lg font-bold text-ink">We could not open this document</h1>
          <p className="mt-2 text-sm text-slate-600">{error}. Please contact the sender for a new link.</p>
        </div>
      </main>
    );
  }
  if (!doc) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper text-brand-600">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading" />
      </main>
    );
  }

  const isInvoice = doc.kind === "invoice";
  const igst = doc.totals.taxType === "IGST";
  const status = STATUS[doc.status] || STATUS.DRAFT;
  const hasBank = !!(doc.company.bankAccountNumber || doc.company.bankName);
  const whatsapp = doc.company.phone ? `https://wa.me/${doc.company.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello, I have a question about ${doc.number}.`)}` : null;

  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="on-dark bg-ink">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            {doc.company.logoDataUrl ? <img src={doc.company.logoDataUrl} alt={doc.company.name} className="h-10 max-w-[140px] object-contain" /> : <LogoMark size={40} />}
            {doc.company.logoDataUrl ? <span className="font-display text-lg font-bold text-paper">{doc.company.name}</span> : <Wordmark className="text-xl" />}
          </div>
          <div className="flex gap-2">
            <a href={`/api/public/doc/${token}/pdf?download=1`} className="flex items-center gap-1.5 rounded-full bg-lime px-4 py-2 text-sm font-bold text-ink hover:brightness-95">
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download PDF</span>
            </a>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-full border border-mist/40 px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-900 print:hidden">
              <Printer className="h-4 w-4" /> <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-6 max-w-4xl space-y-4 px-4">
        {doc.acceptedAt && (
          <div className="flex items-start gap-3 rounded-[20px] bg-lime-soft p-4 text-sm text-brand-900" role="status">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <strong>Accepted</strong> by {doc.acceptedBy} on {fmtDate(doc.acceptedAt)}. Thank you. We will be in touch shortly.
            </div>
          </div>
        )}

        {doc.canAccept && (
          <form onSubmit={accept} className="rounded-[20px] border border-brand-600/30 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base font-bold text-ink">Happy with this quotation?</h2>
            <p className="mt-1 text-sm text-slate-600">Type your name to accept it online. You can also ask us a question first.</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={acceptName}
                onChange={(e) => setAcceptName(e.target.value)}
                placeholder="Your full name"
                required
                minLength={2}
                aria-label="Your full name"
                className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
              <button type="submit" disabled={accepting} className="flex items-center justify-center gap-2 rounded-full bg-lime px-6 py-2.5 text-sm font-bold text-ink hover:brightness-95 disabled:opacity-60">
                {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Accept quotation
              </button>
            </div>
            {acceptError && <p className="mt-2 text-sm text-rose-700" role="alert">{acceptError}</p>}
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
                <MessageCircle className="h-4 w-4" /> Discuss it on WhatsApp
              </a>
            )}
          </form>
        )}

        <article className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">{doc.title}</h1>
              <p className="mt-1 font-mono text-sm text-slate-500">{doc.number}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.cls}`}>{status.label}</span>
          </div>

          <dl className="grid grid-cols-2 gap-4 border-b border-slate-100 p-6 text-sm sm:grid-cols-4">
            <div><dt className="text-xs text-slate-400">{isInvoice ? "Invoice date" : "Date"}</dt><dd className="font-semibold">{fmtDate(doc.date)}</dd></div>
            {doc.dueDate && <div><dt className="text-xs text-slate-400">Due date</dt><dd className="font-semibold">{fmtDate(doc.dueDate)}</dd></div>}
            {doc.validUntil && <div><dt className="text-xs text-slate-400">Valid until</dt><dd className="font-semibold">{fmtDate(doc.validUntil)}</dd></div>}
            {doc.poNumber && <div><dt className="text-xs text-slate-400">PO / Ref</dt><dd className="font-semibold">{doc.poNumber}</dd></div>}
            {doc.totals.placeOfSupply && <div><dt className="text-xs text-slate-400">Place of supply</dt><dd className="font-semibold">{doc.totals.placeOfSupply}</dd></div>}
          </dl>

          <div className="grid gap-4 border-b border-slate-100 p-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-brand-50 p-4 text-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">{isInvoice ? "Billed by" : "Quotation from"}</h2>
              <p className="mt-1 font-semibold text-brand-900">{doc.company.name}</p>
              {doc.company.addressLines.map((l) => (<p key={l} className="text-slate-600">{l}</p>))}
              {doc.company.gstin && <p className="text-slate-600">GSTIN: {doc.company.gstin}</p>}
              {doc.company.email && <p className="text-slate-600">{doc.company.email}</p>}
              {doc.company.phone && <p className="text-slate-600">{doc.company.phone}</p>}
            </div>
            <div className="rounded-2xl bg-brand-50 p-4 text-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">{isInvoice ? "Billed to" : "Quotation for"}</h2>
              <p className="mt-1 font-semibold text-brand-900">{doc.client.company || doc.client.name}</p>
              {doc.client.company && <p className="text-slate-600">Attn: {doc.client.name}</p>}
              {doc.client.address && <p className="whitespace-pre-line text-slate-600">{doc.client.address}</p>}
              {doc.client.gstin && <p className="text-slate-600">GSTIN: {doc.client.gstin}</p>}
            </div>
          </div>

          <div className="overflow-x-auto p-6">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-brand-900 text-xs text-white">
                <tr>
                  <th className="rounded-l-lg px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-center">HSN/SAC</th>
                  <th className="px-3 py-2 text-center">GST</th>
                  <th className="px-3 py-2 text-center">Qty</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">{igst ? "IGST" : "CGST + SGST"}</th>
                  <th className="rounded-r-lg px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doc.items.map((it, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-ink">{i + 1}. {it.description}</div>
                      {it.details && <div className="text-xs text-slate-500">{it.details}</div>}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-600">{it.hsnSac || ""}</td>
                    <td className="px-3 py-3 text-center text-slate-600">{it.taxPercent}%</td>
                    <td className="px-3 py-3 text-center text-slate-600">{it.quantity.toLocaleString("en-IN")}{it.unit ? ` ${it.unit}` : ""}</td>
                    <td className="px-3 py-3 text-right">{inr(it.unitPrice)}</td>
                    <td className="px-3 py-3 text-right">{inr(it.amount)}</td>
                    <td className="px-3 py-3 text-right">{inr(igst ? it.igst : it.cgst + it.sgst)}</td>
                    <td className="px-3 py-3 text-right font-semibold">{inr(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-6 p-6 pt-0 md:grid-cols-2">
            <div className="space-y-4">
              {hasBank && (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600"><Landmark className="h-4 w-4" /> Bank details</h2>
                  <dl className="grid grid-cols-[110px_1fr] gap-y-1 text-slate-600">
                    {doc.company.bankAccountName && (<><dt className="text-slate-400">Account name</dt><dd className="font-semibold text-ink">{doc.company.bankAccountName}</dd></>)}
                    {doc.company.bankAccountNumber && (<><dt className="text-slate-400">Account no.</dt><dd className="font-semibold text-ink">{doc.company.bankAccountNumber}</dd></>)}
                    {doc.company.bankIfsc && (<><dt className="text-slate-400">IFSC</dt><dd className="font-semibold text-ink">{doc.company.bankIfsc}</dd></>)}
                    {doc.company.bankName && (<><dt className="text-slate-400">Bank</dt><dd className="font-semibold text-ink">{[doc.company.bankName, doc.company.bankBranch].filter(Boolean).join(", ")}</dd></>)}
                  </dl>
                </div>
              )}
              {doc.upiQrDataUrl && (
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 text-sm">
                  <img src={doc.upiQrDataUrl} alt="UPI payment QR code" className="h-28 w-28 rounded-lg bg-white" />
                  <div>
                    <h2 className="flex items-center gap-1.5 font-bold text-brand-900"><Smartphone className="h-4 w-4" /> Pay using UPI</h2>
                    <p className="text-slate-600">UPI ID: <span className="font-semibold">{doc.company.upiId}</span></p>
                    <p className="text-slate-600">Amount: <span className="font-semibold">{inr(doc.totals.balanceDue)}</span></p>
                    {doc.upiUri && <a href={doc.upiUri} className="mt-2 inline-block rounded-full bg-lime px-4 py-1.5 text-xs font-bold text-ink sm:hidden">Open UPI app</a>}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-sm">
              <Row label="Amount" value={inr(doc.totals.subTotal)} />
              {doc.totals.discountAmount > 0 && (<><Row label="Discount" value={`- ${inr(doc.totals.discountAmount)}`} tone="text-rose-600" /><Row label="Taxable amount" value={inr(doc.totals.taxableAmount)} /></>)}
              {igst ? <Row label="IGST" value={inr(doc.totals.igstAmount)} /> : (<><Row label="CGST" value={inr(doc.totals.cgstAmount)} /><Row label="SGST" value={inr(doc.totals.sgstAmount)} /></>)}
              {doc.totals.additionalCharges > 0 && <Row label={doc.totals.additionalChargesLabel || "Additional charges"} value={inr(doc.totals.additionalCharges)} />}
              <div className="flex items-center justify-between rounded-xl border-2 border-ink px-3 py-2">
                <span className="font-display font-bold">Total (INR)</span>
                <span className="font-display text-lg font-bold">{inr(doc.totals.totalAmount)}</span>
              </div>
              {isInvoice && doc.totals.amountPaid > 0 && <Row label="Amount paid" value={inr(doc.totals.amountPaid)} tone="text-brand-600" />}
              {isInvoice && <Row label="Balance due" value={inr(doc.totals.balanceDue)} tone={doc.totals.balanceDue > 0 ? "text-amber-700 font-bold" : "text-brand-600 font-bold"} />}
              <p className="pt-1 text-xs text-slate-500">{doc.totals.amountInWords}</p>
            </div>
          </div>

          {(doc.termsAndConditions || doc.notes) && (
            <div className="space-y-4 border-t border-slate-100 p-6 text-sm text-slate-600">
              {doc.termsAndConditions && (<section><h2 className="mb-1 font-display font-bold text-ink">Terms and conditions</h2><p className="whitespace-pre-line">{doc.termsAndConditions}</p></section>)}
              {doc.notes && (<section><h2 className="mb-1 font-display font-bold text-ink">Notes</h2><p className="whitespace-pre-line">{doc.notes}</p></section>)}
            </div>
          )}
        </article>

        <p className="text-center text-xs text-slate-400">This is a computer-generated document from {doc.company.name}.</p>
      </div>
    </main>
  );
}

const Row = ({ label, value, tone = "" }: { label: string; value: string; tone?: string }) => (
  <div className={`flex items-center justify-between ${tone}`}>
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);
