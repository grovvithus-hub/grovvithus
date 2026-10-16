"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Loader2, Plus, Search, Trash2, UserCheck } from "lucide-react";
import { api, errorMessage } from "./api";
import { bankAccountLabel, companyBankAccounts, NO_BANK } from "./bank";
import { CompanySelect } from "./CompanySelect";
import { PAYMENT_METHODS } from "./RecordPaymentDialog";
import type { BillingClient, BillingCompany, Invoice, LineItem, Quotation } from "./types";
import { Modal, inputClass, cellInput, labelClass } from "@/components/ui/kit";

// Like cellInput but sized by the caller (cellInput is w-full, which would override a fixed width).
const inlineInput = "rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-brand-600 focus:outline-none";
import { calculateBilling, GST_STATES } from "@/lib/billing/calc";
import { inr, localDateInput } from "@/lib/billing/format";

export type EditorKind = "quotation" | "invoice";
export type SaveAction = "save" | "draft" | "send" | "new";

interface ItemRow {
  key: string;
  description: string;
  details: string;
  hsnSac: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  taxPercent: string;
}

interface DocForm {
  companyId: string;
  clientId: string;
  poNumber: string;
  bankAccountId: string; // "" = company default, NO_BANK = hide bank details
  title: string;
  leadId: string;
  quotationId: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientGst: string;
  address: string;
  placeOfSupplyCode: string;
  validUntil: string;
  issueDate: string;
  dueDate: string;
  items: ItemRow[];
  discountAmount: string;
  additionalCharges: string;
  additionalChargesLabel: string;
  termsAndConditions: string;
  notes: string;
  amountPaid: string;
  paymentMethod: string;
  paymentReference: string;
  saveClient: boolean;
}

export type EditorInitial = Partial<Quotation & Invoice> & { id?: string };

const GST_RATES = ["0", "5", "12", "18", "28"];
const UNITS = ["Nos", "Pcs", "Hrs", "Days", "Months", "Years", "Project", "Page", "Post", "Video", "Users", "Licence"];

// Quick-add lines for the agency's own services (SAC 998314 = IT design and development services).
const SERVICE_PRESETS: { label: string; unit: string; hsn: string }[] = [
  { label: "Website development", unit: "Project", hsn: "998314" },
  { label: "WordPress website", unit: "Project", hsn: "998314" },
  { label: "Shopify store setup", unit: "Project", hsn: "998314" },
  { label: "Custom software development", unit: "Project", hsn: "998314" },
  { label: "Mobile app development", unit: "Project", hsn: "998314" },
  { label: "Application maintenance (monthly)", unit: "Months", hsn: "998313" },
  { label: "SEO (monthly retainer)", unit: "Months", hsn: "998361" },
  { label: "Digital marketing (monthly retainer)", unit: "Months", hsn: "998361" },
  { label: "Social media management (monthly)", unit: "Months", hsn: "998361" },
  { label: "Video editing", unit: "Video", hsn: "998397" },
  { label: "Poster / social creative design", unit: "Nos", hsn: "998391" },
  { label: "Logo and brand identity", unit: "Project", hsn: "998391" },
  { label: "Content writing", unit: "Nos", hsn: "998399" },
];

let keySeq = 0;
const newKey = () => `row-${Date.now()}-${keySeq++}`;
// Saved dates come back as ISO strings at UTC midnight of the chosen day, so the first 10 characters are that day.
const dateInput = (d?: string | Date | null) => (!d ? "" : typeof d === "string" ? d.slice(0, 10) : localDateInput(d));
const addDays = (days: number) => localDateInput(new Date(Date.now() + days * 24 * 60 * 60 * 1000));

const emptyRow = (taxPercent = "18"): ItemRow => ({
  key: newKey(),
  description: "",
  details: "",
  hsnSac: "",
  quantity: "1",
  unit: "",
  unitPrice: "",
  taxPercent,
});

const rowFromItem = (it: LineItem, docTax?: number): ItemRow => ({
  key: newKey(),
  description: it.description || "",
  details: it.details || "",
  hsnSac: it.hsnSac || "",
  quantity: String(it.quantity ?? 1),
  unit: it.unit || "",
  unitPrice: String(it.unitPrice ?? (it.amount && it.quantity ? Number(it.amount) / Number(it.quantity) : "")),
  taxPercent: String(it.taxPercent ?? docTax ?? 18),
});

const formFrom = (kind: EditorKind, d: EditorInitial | null | undefined): DocForm => ({
  companyId: d?.companyId || "",
  clientId: d?.clientId || "",
  poNumber: d?.poNumber || "",
  bankAccountId: d?.bankAccountId || "",
  title: d?.title || "",
  leadId: d?.leadId || "",
  quotationId: d?.quotationId || "",
  clientName: d?.clientName || "",
  clientCompany: d?.clientCompany || "",
  clientEmail: d?.clientEmail || "",
  clientPhone: d?.clientPhone || "",
  clientGst: d?.clientGst || "",
  address: (kind === "invoice" ? d?.billingAddress : d?.clientAddress) || d?.clientAddress || d?.billingAddress || "",
  placeOfSupplyCode: d?.placeOfSupplyCode || "",
  validUntil: d?.id ? dateInput(d?.validUntil) : dateInput(d?.validUntil) || addDays(15),
  issueDate: dateInput(d?.issueDate) || dateInput(new Date()),
  dueDate: dateInput(d?.dueDate) || addDays(15),
  items: Array.isArray(d?.items) && d!.items!.length ? d!.items!.map((it) => rowFromItem(it as LineItem, d?.taxPercent)) : [emptyRow()],
  discountAmount: d?.discountAmount ? String(d.discountAmount) : "",
  additionalCharges: d?.additionalCharges ? String(d.additionalCharges) : "",
  additionalChargesLabel: d?.additionalChargesLabel || "",
  termsAndConditions: d?.termsAndConditions || "",
  notes: d?.notes || "",
  amountPaid: "",
  paymentMethod: "BANK_TRANSFER",
  paymentReference: "",
  saveClient: false,
});

export function DocumentEditor({
  kind,
  initial,
  onClose,
  onSaved,
}: {
  kind: EditorKind;
  initial?: EditorInitial | null; // existing document (has id) or a prefill (no id)
  onClose: () => void;
  onSaved: (doc: Quotation | Invoice, action: SaveAction) => void;
}) {
  const isEdit = !!initial?.id;
  const isInvoice = kind === "invoice";
  const [form, setForm] = useState<DocForm>(() => formFrom(kind, initial));
  const [company, setCompany] = useState<BillingCompany | null>(null);
  const [saving, setSaving] = useState<SaveAction | null>(null);
  const [error, setError] = useState("");
  const termsFilled = useRef(!!initial?.termsAndConditions);

  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<BillingClient[]>([]);
  const [showClientResults, setShowClientResults] = useState(false);

  const set = <K extends keyof DocForm>(key: K, value: DocForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const bankAccounts = companyBankAccounts(company);
  // A saved account that belongs to another company, or is this company's default, shows as "default".
  const bankValue =
    form.bankAccountId === NO_BANK || bankAccounts.some((a) => a.id === form.bankAccountId && !a.isDefault) ? form.bankAccountId : "";

  // Called when the company picker settles on a company: fill default terms and notes on new documents.
  const handleCompanyChange = useCallback(
    (c: BillingCompany | null) => {
      setCompany(c);
      if (!c || isEdit || termsFilled.current) return;
      const terms = isInvoice ? c.invoiceTerms : c.quotationTerms;
      if (terms || c.defaultNotes) {
        setForm((f) => ({ ...f, termsAndConditions: f.termsAndConditions || terms || "", notes: f.notes || c.defaultNotes || "" }));
        termsFilled.current = true;
      }
    },
    [isEdit, isInvoice],
  );

  useEffect(() => {
    if (!clientQuery.trim()) return;
    const t = setTimeout(() => {
      api<BillingClient[]>(`/api/admin/clients?search=${encodeURIComponent(clientQuery)}`).then(setClientResults).catch(() => setClientResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [clientQuery]);

  const pickClient = (c: BillingClient) => {
    setForm((f) => ({
      ...f,
      clientId: c.id,
      clientName: c.name,
      clientCompany: c.company || "",
      clientEmail: c.email || "",
      clientPhone: c.phone || "",
      clientGst: c.gstin || "",
      address: c.billingAddress || "",
      placeOfSupplyCode: c.stateCode || "",
      saveClient: false,
    }));
    setClientQuery("");
    setShowClientResults(false);
  };

  const totals = useMemo(
    () =>
      calculateBilling({
        items: form.items,
        taxPercent: 18,
        discountAmount: form.discountAmount,
        additionalCharges: form.additionalCharges,
        placeOfSupplyCode: form.placeOfSupplyCode || null,
        clientGst: form.clientGst,
        supplierStateCode: company?.stateCode || null,
      }),
    [form.items, form.discountAmount, form.additionalCharges, form.placeOfSupplyCode, form.clientGst, company],
  );

  const updateRow = (key: string, field: keyof ItemRow, value: string) =>
    setForm((f) => ({ ...f, items: f.items.map((r) => (r.key === key ? { ...r, [field]: value } : r)) }));
  const addRow = () => setForm((f) => ({ ...f, items: [...f.items, emptyRow(f.items[f.items.length - 1]?.taxPercent || "18")] }));
  const duplicateRow = (key: string) =>
    setForm((f) => {
      const idx = f.items.findIndex((r) => r.key === key);
      const copy = { ...f.items[idx], key: newKey() };
      return { ...f, items: [...f.items.slice(0, idx + 1), copy, ...f.items.slice(idx + 1)] };
    });
  const removeRow = (key: string) => setForm((f) => ({ ...f, items: f.items.length > 1 ? f.items.filter((r) => r.key !== key) : [emptyRow()] }));

  const addPreset = (label: string) => {
    const preset = SERVICE_PRESETS.find((p) => p.label === label);
    if (!preset) return;
    setForm((f) => {
      const row = { ...emptyRow(f.items[f.items.length - 1]?.taxPercent || "18"), description: preset.label, unit: preset.unit, hsnSac: preset.hsn };
      const onlyBlank = f.items.length === 1 && !f.items[0].description.trim() && !parseFloat(f.items[0].unitPrice);
      return { ...f, items: onlyBlank ? [row] : [...f.items, row] };
    });
  };

  const lineAmount = (r: ItemRow) => (parseFloat(r.quantity) || 0) * (parseFloat(r.unitPrice) || 0);

  const handleSave = async (action: SaveAction) => {
    setError("");
    const items = form.items.filter((r) => r.description.trim() || parseFloat(r.unitPrice));
    if (!form.clientName.trim()) return setError("Enter the client name.");
    if (!form.clientEmail.trim()) return setError("Enter the client email.");
    if (!items.length) return setError("Add at least one item.");
    if (items.some((r) => !r.description.trim())) return setError("Every item needs a name.");
    if (isInvoice && form.dueDate && form.issueDate && form.dueDate < form.issueDate) {
      return setError("Due date cannot be before the invoice date.");
    }

    setSaving(action);
    try {
      let clientId = form.clientId;
      if (form.saveClient && !clientId) {
        const client = await api<BillingClient>("/api/admin/clients", {
          body: {
            name: form.clientName,
            company: form.clientCompany,
            email: form.clientEmail,
            phone: form.clientPhone,
            gstin: form.clientGst,
            billingAddress: form.address,
            stateCode: totals.placeOfSupplyCode,
            state: totals.placeOfSupply,
          },
        });
        clientId = client.id;
      }

      const common = {
        companyId: form.companyId || null,
        clientId: clientId || null,
        poNumber: form.poNumber,
        bankAccountId: bankValue || null,
        clientName: form.clientName,
        clientCompany: form.clientCompany,
        clientEmail: form.clientEmail,
        clientPhone: form.clientPhone,
        clientGst: form.clientGst,
        placeOfSupplyCode: form.placeOfSupplyCode || null,
        items: items.map((r) => ({
          description: r.description,
          details: r.details,
          hsnSac: r.hsnSac,
          quantity: parseFloat(r.quantity) || 0,
          unit: r.unit,
          unitPrice: parseFloat(r.unitPrice) || 0,
          taxPercent: parseFloat(r.taxPercent) || 0,
        })),
        taxPercent: 18,
        discountAmount: parseFloat(form.discountAmount) || 0,
        additionalCharges: parseFloat(form.additionalCharges) || 0,
        additionalChargesLabel: form.additionalChargesLabel,
        termsAndConditions: form.termsAndConditions,
        notes: form.notes,
      };

      let saved: Quotation | Invoice;
      if (isInvoice) {
        const payload = {
          ...common,
          billingAddress: form.address,
          issueDate: form.issueDate || null,
          dueDate: form.dueDate || null,
          isDraft: action === "draft",
          quotationId: form.quotationId || null,
          ...(isEdit ? {} : { amountPaid: parseFloat(form.amountPaid) || 0, paymentMethod: form.paymentMethod, paymentReference: form.paymentReference }),
        };
        saved = isEdit
          ? await api<Invoice>(`/api/admin/invoices/${initial!.id}`, { method: "PUT", body: payload })
          : await api<Invoice>("/api/admin/invoices", { body: payload });
      } else {
        const payload = { ...common, title: form.title, clientAddress: form.address, validUntil: form.validUntil || null, leadId: form.leadId || null };
        saved = isEdit
          ? await api<Quotation>(`/api/admin/quotations/${initial!.id}`, { method: "PUT", body: payload })
          : await api<Quotation>("/api/admin/quotations", { body: payload });
      }

      onSaved(saved, action);
      if (action === "new") setForm((f) => ({ ...formFrom(kind, null), companyId: f.companyId, termsAndConditions: f.termsAndConditions }));
    } catch (err) {
      setError(errorMessage(err, "Could not save. Please check the details."));
    } finally {
      setSaving(null);
    }
  };

  const numberLabel = isInvoice ? (initial as Invoice)?.invoiceNumber : (initial as Quotation)?.quotationNumber;
  const isIgst = totals.taxType === "IGST";
  const busy = !!saving;

  const footerButton = (label: string, action: SaveAction, style: string) => (
    <button
      type="button"
      disabled={busy}
      onClick={() => handleSave(action)}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-60 ${style}`}
    >
      {saving === action && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </button>
  );

  return (
    <Modal
      size="xl"
      title={isEdit ? `Edit ${isInvoice ? "Invoice" : "Quotation"} ${numberLabel || ""}` : `New ${isInvoice ? "Invoice" : "Quotation"}`}
      subtitle="The number is assigned automatically when you save."
      onClose={onClose}
      footer={
        <div className="space-y-2">
          {error && <div className="whitespace-pre-line text-sm text-rose-600">{error}</div>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            {isInvoice && footerButton("Save as draft", "draft", "border border-slate-300 text-slate-700 hover:bg-slate-50")}
            {!isEdit && footerButton("Save & new", "new", "border border-slate-300 text-slate-700 hover:bg-slate-50")}
            {footerButton("Save", "save", "bg-slate-900 text-white hover:bg-slate-800")}
            {footerButton("Save & send", "send", "bg-lime text-ink hover:brightness-95")}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Document details */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <CompanySelect value={form.companyId} onChange={(id) => set("companyId", id)} onCompanyChange={handleCompanyChange} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Bank account shown to the client</label>
            <select value={bankValue} onChange={(e) => set("bankAccountId", e.target.value)} className={inputClass}>
              {bankAccounts.length === 0 ? (
                <option value="">No bank account in Billing settings</option>
              ) : (
                bankAccounts.map((a) => (
                  <option key={a.id} value={a.isDefault ? "" : a.id}>
                    {bankAccountLabel(a)}
                    {a.isDefault ? " (default)" : ""}
                  </option>
                ))
              )}
              <option value={NO_BANK}>Don&apos;t show bank details</option>
            </select>
          </div>
          {isInvoice ? (
            <>
              <div>
                <label className={labelClass}>Invoice date *</label>
                <input type="date" value={form.issueDate} onChange={(e) => set("issueDate", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Due date *</label>
                <input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Client PO / Ref No.</label>
                <input value={form.poNumber} onChange={(e) => set("poNumber", e.target.value)} className={inputClass} placeholder="Optional" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={labelClass}>Valid until</label>
                <input type="date" value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Client PO / Ref No.</label>
                <input value={form.poNumber} onChange={(e) => set("poNumber", e.target.value)} className={inputClass} placeholder="Optional" />
              </div>
              <div className="md:col-span-4">
                <label className={labelClass}>Quotation title (printed at the top)</label>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Website Development Proposal (leave empty for “Quotation”)"
                />
              </div>
            </>
          )}
        </section>

        {/* Billed To */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Billed to (client)</h4>
            {form.clientId && (
              <span className="flex items-center gap-1.5 text-xs text-brand-600">
                <UserCheck className="h-3.5 w-3.5" /> Saved client
                <button type="button" className="text-slate-500 underline" onClick={() => set("clientId", "")}>
                  unlink
                </button>
              </span>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={clientQuery}
              onChange={(e) => {
                setClientQuery(e.target.value);
                setShowClientResults(true);
              }}
              onFocus={() => setShowClientResults(true)}
              onBlur={() => setTimeout(() => setShowClientResults(false), 150)}
              className={`${inputClass} pl-9`}
              placeholder="Search saved clients by name, company, email, phone or GSTIN…"
            />
            {showClientResults && clientQuery.trim() && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {clientResults.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-500">No saved client found. Fill in the details below.</div>
                ) : (
                  clientResults.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickClient(c)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <div className="font-semibold text-slate-900">{c.company || c.name}</div>
                      <div className="text-xs text-slate-500">{[c.company ? c.name : "", c.email, c.gstin].filter(Boolean).join(" · ")}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Contact person *</label>
              <input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Company / business name</label>
              <input value={form.clientCompany} onChange={(e) => set("clientCompany", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>GSTIN</label>
              <input value={form.clientGst} onChange={(e) => set("clientGst", e.target.value.toUpperCase())} className={inputClass} placeholder="Leave empty if unregistered" />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" value={form.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone / WhatsApp</label>
              <input value={form.clientPhone} onChange={(e) => set("clientPhone", e.target.value)} className={inputClass} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className={labelClass}>Place of supply</label>
              <select value={form.placeOfSupplyCode} onChange={(e) => set("placeOfSupplyCode", e.target.value)} className={inputClass}>
                <option value="">Auto{totals.placeOfSupply ? ` – ${totals.placeOfSupply}` : " (from client GSTIN / company state)"}</option>
                {Object.entries(GST_STATES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name} ({code})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className={labelClass}>{isInvoice ? "Billing address" : "Client address"}</label>
              <textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} className={inputClass} />
            </div>
          </div>
          {!form.clientId && (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={form.saveClient} onChange={(e) => set("saveClient", e.target.checked)} />
              Save this client for next time
            </label>
          )}
        </section>

        {/* Items */}
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Items</h4>
            <div className="flex items-center gap-3">
              <select
                value=""
                onChange={(e) => addPreset(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                aria-label="Add a service line"
              >
                <option value="">+ Add a service line…</option>
                {SERVICE_PRESETS.map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500">
                Tax: <strong>{isIgst ? "IGST" : "CGST + SGST"}</strong>
                {company?.stateCode ? "" : " (set your company state in Billing settings)"}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-brand-900 text-xs text-white">
                <tr>
                  <th className="w-8 px-2 py-2 text-left">#</th>
                  <th className="px-2 py-2 text-left">Item / service *</th>
                  <th className="w-24 px-2 py-2 text-left">HSN/SAC</th>
                  <th className="w-20 px-2 py-2 text-left">GST %</th>
                  <th className="w-20 px-2 py-2 text-left">Qty</th>
                  <th className="w-24 px-2 py-2 text-left">Unit</th>
                  <th className="w-28 px-2 py-2 text-left">Rate (&#8377;)</th>
                  <th className="w-28 px-2 py-2 text-right">Amount</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {form.items.map((r, idx) => (
                  <tr key={r.key} className="align-top">
                    <td className="px-2 py-2 pt-3.5 text-xs text-slate-400">{idx + 1}</td>
                    <td className="space-y-1 px-2 py-2">
                      <input value={r.description} onChange={(e) => updateRow(r.key, "description", e.target.value)} className={cellInput} placeholder="Item name" />
                      <input value={r.details} onChange={(e) => updateRow(r.key, "details", e.target.value)} className={`${cellInput} text-xs`} placeholder="Description (optional)" />
                    </td>
                    <td className="px-2 py-2">
                      <input value={r.hsnSac} onChange={(e) => updateRow(r.key, "hsnSac", e.target.value)} className={cellInput} placeholder="998314" />
                    </td>
                    <td className="px-2 py-2">
                      <select value={r.taxPercent} onChange={(e) => updateRow(r.key, "taxPercent", e.target.value)} className={cellInput}>
                        {(GST_RATES.includes(r.taxPercent) ? GST_RATES : [...GST_RATES, r.taxPercent]).map((g) => (
                          <option key={g} value={g}>
                            {g}%
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" min="0" step="any" value={r.quantity} onChange={(e) => updateRow(r.key, "quantity", e.target.value)} className={cellInput} />
                    </td>
                    <td className="px-2 py-2">
                      <input list="billing-units" value={r.unit} onChange={(e) => updateRow(r.key, "unit", e.target.value)} className={cellInput} placeholder="Nos" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" min="0" step="any" value={r.unitPrice} onChange={(e) => updateRow(r.key, "unitPrice", e.target.value)} className={cellInput} placeholder="0" />
                    </td>
                    <td className="px-2 py-2 pt-3.5 text-right font-semibold text-slate-900">{inr(lineAmount(r))}</td>
                    <td className="px-2 py-2 pt-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => duplicateRow(r.key)} className="p-1 text-slate-400 hover:text-brand-600" title="Duplicate line">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => removeRow(r.key)} className="p-1 text-slate-400 hover:text-rose-600" title="Remove line">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <datalist id="billing-units">
              {UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
          <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-900">
            <Plus className="h-4 w-4" /> Add line
          </button>
        </section>

        {/* Terms + totals */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <div>
              <label className={labelClass}>Terms &amp; conditions</label>
              <textarea rows={6} value={form.termsAndConditions} onChange={(e) => set("termsAndConditions", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Notes (printed on the document)</label>
              <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputClass} />
            </div>
            {isInvoice && !isEdit && (
              <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Advance already received (optional)</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input type="number" min="0" step="any" value={form.amountPaid} onChange={(e) => set("amountPaid", e.target.value)} className={inputClass} placeholder="Amount ₹" />
                  <select value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)} className={inputClass}>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <input value={form.paymentReference} onChange={(e) => set("paymentReference", e.target.value)} className={inputClass} placeholder="UTR / reference" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 self-start rounded-xl bg-slate-50 p-4 text-sm lg:col-span-2">
            <Row label="Amount" value={inr(totals.subTotal)} />
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Discount (&#8377;)</span>
              <input type="number" min="0" step="any" value={form.discountAmount} onChange={(e) => set("discountAmount", e.target.value)} className={`${inlineInput} w-32 shrink-0 text-right`} placeholder="0" />
            </div>
            {totals.discountAmount > 0 && <Row label="Taxable amount" value={inr(totals.taxableAmount)} />}
            {isIgst ? (
              <Row label="IGST" value={inr(totals.igstAmount)} />
            ) : (
              <>
                <Row label="CGST" value={inr(totals.cgstAmount)} />
                <Row label="SGST" value={inr(totals.sgstAmount)} />
              </>
            )}
            <div className="flex items-center justify-between gap-2">
              <input value={form.additionalChargesLabel} onChange={(e) => set("additionalChargesLabel", e.target.value)} className={`${inlineInput} min-w-0 flex-1 text-xs`} placeholder="Other charges (e.g. travel)" />
              <input type="number" min="0" step="any" value={form.additionalCharges} onChange={(e) => set("additionalCharges", e.target.value)} className={`${inlineInput} w-32 shrink-0 text-right`} placeholder="0" />
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
              <span className="font-bold text-slate-900">Total (INR)</span>
              <span className="text-lg font-extrabold text-slate-900">{inr(totals.totalAmount)}</span>
            </div>
            <p className="text-xs text-slate-500">{totals.amountInWords}</p>
            {isInvoice && isEdit && Number((initial as Invoice)?.amountPaid) > 0 && <Row label="Already received" value={inr((initial as Invoice).amountPaid)} />}
          </div>
        </section>
      </div>
    </Modal>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-900">{value}</span>
  </div>
);
