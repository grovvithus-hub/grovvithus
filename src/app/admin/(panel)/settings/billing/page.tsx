"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Edit2, History, Plus, Star, Trash2, Upload } from "lucide-react";
import { api, errorMessage } from "@/components/billing/api";
import type { BankAccount, BillingCompany } from "@/components/billing/types";
import { companyBankAccounts } from "@/components/billing/bank";
import { useDialog } from "@/components/ui/DialogProvider";
import { Button, IconButton, Modal, PageHeader, Spinner, inputClass, labelClass } from "@/components/ui/kit";
import { GST_STATES } from "@/lib/billing/calc";

type Form = {
  name: string; gstin: string; pan: string; email: string; phone: string; website: string;
  addressLine1: string; addressLine2: string; city: string; state: string; stateCode: string; pincode: string; country: string;
  logoDataUrl: string; signatureDataUrl: string; stampDataUrl: string; upiId: string;
  bankAccounts: BankAccount[];
  quotationTerms: string; invoiceTerms: string; defaultNotes: string; emailCc: string;
  isDefault: boolean;
};

const blankForm = (): Form => ({
  name: "", gstin: "", pan: "", email: "", phone: "", website: "",
  addressLine1: "", addressLine2: "", city: "", state: "", stateCode: "", pincode: "", country: "India",
  logoDataUrl: "", signatureDataUrl: "", stampDataUrl: "", upiId: "",
  bankAccounts: [],
  quotationTerms: "", invoiceTerms: "", defaultNotes: "", emailCc: "",
  isDefault: false,
});

const fromCompany = (c: BillingCompany): Form => ({
  name: c.name, gstin: c.gstin || "", pan: c.pan || "", email: c.email || "", phone: c.phone || "", website: c.website || "",
  addressLine1: c.addressLine1 || "", addressLine2: c.addressLine2 || "", city: c.city || "", state: c.state || "", stateCode: c.stateCode || "", pincode: c.pincode || "", country: c.country || "India",
  logoDataUrl: c.logoDataUrl || "", signatureDataUrl: c.signatureDataUrl || "", stampDataUrl: c.stampDataUrl || "", upiId: c.upiId || "",
  bankAccounts: companyBankAccounts(c),
  quotationTerms: c.quotationTerms || "", invoiceTerms: c.invoiceTerms || "", defaultNotes: c.defaultNotes || "", emailCc: c.emailCc || "",
  isDefault: c.isDefault,
});

const blankAccount = (isDefault: boolean): BankAccount => ({ id: "", label: "", accountName: "", bankName: "", accountNumber: "", ifsc: "", branch: "", swift: "", isDefault });

const MAX_IMAGE_BYTES = 500 * 1024;

function ImagePicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [problem, setProblem] = useState("");
  const pick = (file?: File) => {
    setProblem("");
    if (!file) return;
    if (!/^image\/(png|jpe?g)$/.test(file.type)) return setProblem("Use a PNG or JPEG image.");
    if (file.size > MAX_IMAGE_BYTES) return setProblem("Image is too large (max 500 KB).");
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt={label} className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-slate-400">None</span>}
        </div>
        <div className="space-y-1 text-xs">
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50">
            <Upload className="h-3.5 w-3.5" /> Upload
            <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          {value && (
            <button type="button" onClick={() => onChange("")} className="ml-2 text-rose-600 underline">
              Remove
            </button>
          )}
          {problem && <p className="text-rose-600">{problem}</p>}
        </div>
      </div>
    </div>
  );
}

interface BankHistoryRow { id: string; at: string; changedBy: string; changes: string[]; ipAddress: string | null }

export default function BillingSettingsPage() {
  const { confirm, alert } = useDialog();
  const [companies, setCompanies] = useState<BillingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ id?: string; form: Form } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<{ name: string; rows: BankHistoryRow[] } | null>(null);

  const load = useCallback(
    () =>
      api<BillingCompany[]>("/api/admin/companies")
        .then(setCompanies)
        .catch(() => null)
        .finally(() => setLoading(false)),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));
  const updateAccount = (i: number, patch: Partial<BankAccount>) =>
    setEditing((e) => (e ? { ...e, form: { ...e.form, bankAccounts: e.form.bankAccounts.map((a, idx) => (idx === i ? { ...a, ...patch } : patch.isDefault ? { ...a, isDefault: false } : a)) } } : e));

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const f = editing.form;
      const body = { ...f, state: f.stateCode ? GST_STATES[f.stateCode] || f.state : f.state };
      if (editing.id) await api(`/api/admin/companies/${editing.id}`, { method: "PUT", body });
      else await api("/api/admin/companies", { body });
      setEditing(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (c: BillingCompany) => {
    try {
      await api(`/api/admin/companies/${c.id}/default`, { body: {} });
      load();
    } catch (err) {
      await alert({ title: "Could not change the default", message: errorMessage(err), variant: "error" });
    }
  };

  const remove = async (c: BillingCompany) => {
    const used = (c._count?.quotations || 0) + (c._count?.invoices || 0) > 0;
    const ok = await confirm({
      title: used ? "Deactivate company" : "Delete company",
      message: used ? `${c.name} appears on existing documents, so it will be deactivated (kept for old PDFs) instead of deleted.` : `Delete ${c.name}?`,
      confirmText: used ? "Deactivate" : "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await api(`/api/admin/companies/${c.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      await alert({ title: "Could not update the company", message: errorMessage(err), variant: "error" });
    }
  };

  const showHistory = async (c: BillingCompany) => {
    try {
      setHistory({ name: c.name, rows: await api<BankHistoryRow[]>(`/api/admin/companies/${c.id}/bank-history`) });
    } catch (err) {
      await alert({ title: "Could not load history", message: errorMessage(err), variant: "error" });
    }
  };

  return (
    <>
      <PageHeader
        title="Billing settings"
        subtitle="The companies that issue your quotations and invoices: legal details, GST state, bank accounts, UPI, logo, signature and default terms."
        action={
          <Button onClick={() => setEditing({ form: { ...blankForm(), isDefault: companies.length === 0 } })} className="!bg-lime !text-ink">
            <Plus className="h-4 w-4" /> Add company
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600">
          <Spinner className="h-8 w-8" />
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-[20px] border border-slate-200 bg-white py-16 text-center">
          <Building2 className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="font-bold text-slate-900">Set up your company</h3>
          <p className="mt-1 text-xs text-slate-500">Documents need a company name, address, GST state and bank details.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {companies.map((c) => (
            <div key={c.id} className={`rounded-[20px] border bg-white p-5 shadow-sm ${c.isActive ? "border-slate-200" : "border-dashed border-slate-300 opacity-70"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display truncate text-lg font-bold text-ink">{c.name}</h3>
                  <p className="text-xs text-slate-500">
                    {[c.city, c.state].filter(Boolean).join(", ") || "Address not set"}
                    {c.stateCode ? ` (GST state ${c.stateCode})` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {c.isDefault && <span className="rounded-full bg-lime px-2.5 py-1 text-xs font-bold text-ink">Default</span>}
                  {!c.isActive && <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">Inactive</span>}
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                <dt className="text-slate-400">GSTIN</dt><dd className="font-mono">{c.gstin || "—"}</dd>
                <dt className="text-slate-400">Bank accounts</dt><dd>{companyBankAccounts(c).length}</dd>
                <dt className="text-slate-400">UPI</dt><dd>{c.upiId || "—"}</dd>
                <dt className="text-slate-400">Documents</dt><dd>{(c._count?.quotations || 0) + (c._count?.invoices || 0)}</dd>
              </dl>
              <div className="mt-4 flex items-center justify-end gap-1">
                {!c.isDefault && c.isActive && <IconButton title="Make default" icon={Star} onClick={() => makeDefault(c)} />}
                <IconButton title="Bank & UPI change history" icon={History} onClick={() => showHistory(c)} />
                <IconButton title="Edit" icon={Edit2} onClick={() => setEditing({ id: c.id, form: fromCompany(c) })} />
                {!c.isDefault && <IconButton title="Delete" icon={Trash2} className="text-rose-600" onClick={() => remove(c)} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          size="lg"
          title={editing.id ? `Edit ${editing.form.name || "company"}` : "Add company"}
          onClose={() => setEditing(null)}
          footer={
            <div className="space-y-2">
              {error && <p className="whitespace-pre-line text-sm text-rose-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button busy={saving} onClick={save}>Save company</Button>
              </div>
            </div>
          }
        >
          <div className="space-y-6">
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Company</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><label className={labelClass}>Legal name *</label><input value={editing.form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>GSTIN</label><input value={editing.form.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} className={inputClass} placeholder="Leave empty if not registered" /></div>
                <div><label className={labelClass}>PAN</label><input value={editing.form.pan} onChange={(e) => set("pan", e.target.value.toUpperCase())} className={inputClass} /></div>
                <div><label className={labelClass}>Email</label><input type="email" value={editing.form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Phone</label><input value={editing.form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} /></div>
                <div className="sm:col-span-2"><label className={labelClass}>Website</label><input value={editing.form.website} onChange={(e) => set("website", e.target.value)} className={inputClass} /></div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Address and GST state</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className={labelClass}>Address line 1</label><input value={editing.form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Address line 2</label><input value={editing.form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>City</label><input value={editing.form.city} onChange={(e) => set("city", e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Pincode</label><input value={editing.form.pincode} onChange={(e) => set("pincode", e.target.value)} className={inputClass} /></div>
                <div>
                  <label className={labelClass}>State (decides CGST + SGST or IGST) *</label>
                  <select value={editing.form.stateCode} onChange={(e) => set("stateCode", e.target.value)} className={inputClass}>
                    <option value="">Select state</option>
                    {Object.entries(GST_STATES).filter(([code]) => code !== "96").map(([code, name]) => (<option key={code} value={code}>{name} ({code})</option>))}
                  </select>
                </div>
                <div><label className={labelClass}>Country</label><input value={editing.form.country} onChange={(e) => set("country", e.target.value)} className={inputClass} /></div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Bank accounts</h4>
                <button type="button" onClick={() => set("bankAccounts", [...editing.form.bankAccounts, blankAccount(editing.form.bankAccounts.length === 0)])} className="flex items-center gap-1 text-sm font-semibold text-brand-600">
                  <Plus className="h-4 w-4" /> Add account
                </button>
              </div>
              {editing.form.bankAccounts.length === 0 && <p className="text-xs text-slate-500">No bank account yet. Documents will print without bank details.</p>}
              {editing.form.bankAccounts.map((a, i) => (
                <div key={a.id || i} className="space-y-3 rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
                      <input type="radio" name="default-bank" checked={a.isDefault} onChange={() => updateAccount(i, { isDefault: true })} /> Default account
                    </label>
                    <button type="button" onClick={() => set("bankAccounts", editing.form.bankAccounts.filter((_, idx) => idx !== i))} className="text-xs text-rose-600 underline">Remove</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className={labelClass}>Label (optional)</label><input value={a.label || ""} onChange={(e) => updateAccount(i, { label: e.target.value })} className={inputClass} placeholder="e.g. Current account" /></div>
                    <div><label className={labelClass}>Account holder</label><input value={a.accountName || ""} onChange={(e) => updateAccount(i, { accountName: e.target.value })} className={inputClass} /></div>
                    <div><label className={labelClass}>Bank</label><input value={a.bankName || ""} onChange={(e) => updateAccount(i, { bankName: e.target.value })} className={inputClass} /></div>
                    <div><label className={labelClass}>Account number</label><input value={a.accountNumber || ""} onChange={(e) => updateAccount(i, { accountNumber: e.target.value.trim() })} className={inputClass} inputMode="numeric" /></div>
                    <div><label className={labelClass}>IFSC</label><input value={a.ifsc || ""} onChange={(e) => updateAccount(i, { ifsc: e.target.value.toUpperCase() })} className={inputClass} /></div>
                    <div><label className={labelClass}>Branch</label><input value={a.branch || ""} onChange={(e) => updateAccount(i, { branch: e.target.value })} className={inputClass} /></div>
                    <div><label className={labelClass}>SWIFT (international)</label><input value={a.swift || ""} onChange={(e) => updateAccount(i, { swift: e.target.value.toUpperCase() })} className={inputClass} /></div>
                  </div>
                </div>
              ))}
              <div className="max-w-sm">
                <label className={labelClass}>UPI ID (adds a QR code to invoices)</label>
                <input value={editing.form.upiId} onChange={(e) => set("upiId", e.target.value.trim())} className={inputClass} placeholder="name@bank" />
              </div>
              <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Changing bank or UPI details emails every Super Admin and is recorded in the history, because these details appear on documents sent to clients.</p>
            </section>

            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Logo, signature and stamp</h4>
              <p className="text-xs text-slate-500">PNG or JPEG, up to 500 KB each. Without a logo, documents use the GrovvIthUs mark.</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <ImagePicker label="Logo" value={editing.form.logoDataUrl} onChange={(v) => set("logoDataUrl", v)} />
                <ImagePicker label="Signature" value={editing.form.signatureDataUrl} onChange={(v) => set("signatureDataUrl", v)} />
                <ImagePicker label="Stamp" value={editing.form.stampDataUrl} onChange={(v) => set("stampDataUrl", v)} />
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Document defaults</h4>
              <div><label className={labelClass}>Quotation terms</label><textarea rows={4} value={editing.form.quotationTerms} onChange={(e) => set("quotationTerms", e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Invoice terms</label><textarea rows={4} value={editing.form.invoiceTerms} onChange={(e) => set("invoiceTerms", e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Default notes</label><textarea rows={2} value={editing.form.defaultNotes} onChange={(e) => set("defaultNotes", e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>CC on every document email (comma separated)</label><input value={editing.form.emailCc} onChange={(e) => set("emailCc", e.target.value)} className={inputClass} /></div>
              {!editing.id && (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" checked={editing.form.isDefault} onChange={(e) => set("isDefault", e.target.checked)} /> Make this the default company
                </label>
              )}
            </section>
          </div>
        </Modal>
      )}

      {history && (
        <Modal title="Bank & UPI change history" subtitle={history.name} onClose={() => setHistory(null)} z={60}>
          {history.rows.length === 0 ? (
            <p className="text-sm text-slate-500">No changes recorded.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {history.rows.map((r) => (
                <li key={r.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">
                    {new Date(r.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} &middot; {r.changedBy}
                    {r.ipAddress ? ` · ${r.ipAddress}` : ""}
                  </div>
                  <ul className="mt-1 list-disc pl-5 text-slate-700">
                    {r.changes.map((c, i) => (<li key={i}>{c}</li>))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </>
  );
}
