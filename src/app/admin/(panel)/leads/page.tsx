"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, FileText, Plus, Search, Trash2, UserSquare2 } from "lucide-react";
import { api, errorMessage } from "@/components/billing/api";
import type { Lead } from "@/components/billing/types";
import { useDialog } from "@/components/ui/DialogProvider";
import { Button, IconButton, Modal, PageHeader, Spinner, inputClass, labelClass } from "@/components/ui/kit";
import { fmtDate } from "@/lib/billing/format";

const STATUSES = ["NEW", "CONTACTED", "DEMO_SCHEDULED", "DEMO_COMPLETED", "PROPOSAL_SENT", "NEGOTIATING", "WON", "LOST"];
const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const empty = { clientName: "", companyName: "", email: "", phone: "", serviceOfInterest: "", projectDetails: "", timeline: "", source: "MANUAL", status: "NEW", estimatedValue: "", notes: "" };

export default function LeadsPage() {
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [editing, setEditing] = useState<{ id?: string; form: typeof empty } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ status });
      if (search) qs.set("search", search);
      setLeads(await api<Lead[]>(`/api/admin/leads?${qs}`));
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const toBody = (f: typeof empty) => ({ ...f, estimatedValue: parseFloat(f.estimatedValue) || 0 });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      if (editing.id) await api(`/api/admin/leads/${editing.id}`, { method: "PUT", body: toBody(editing.form) });
      else await api("/api/admin/leads", { body: toBody(editing.form) });
      setEditing(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (lead: Lead, next: string) => {
    try {
      await api(`/api/admin/leads/${lead.id}`, {
        method: "PUT",
        body: { clientName: lead.clientName, companyName: lead.companyName, email: lead.email, phone: lead.phone, serviceOfInterest: lead.serviceOfInterest, projectDetails: lead.projectDetails, timeline: lead.timeline, source: lead.source, estimatedValue: lead.estimatedValue, notes: lead.notes, status: next },
      });
      load();
    } catch (err) {
      await alert({ title: "Could not update the lead", message: errorMessage(err), variant: "error" });
    }
  };

  const remove = async (lead: Lead) => {
    if (!(await confirm({ title: "Delete lead", message: `Delete ${lead.leadNumber} (${lead.clientName})?`, confirmText: "Delete", variant: "danger" }))) return;
    try {
      await api(`/api/admin/leads/${lead.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      await alert({ title: "Could not delete", message: errorMessage(err), variant: "error" });
    }
  };

  const set = (k: keyof typeof empty, v: string) => setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="Enquiries from the website (quote, demo and call requests) and leads you add yourself. Turn a lead into a quotation in one click."
        action={
          <Button onClick={() => setEditing({ form: { ...empty } })} className="bg-white !text-ink hover:!bg-lime-soft">
            <Plus className="h-4 w-4" /> Add lead
          </Button>
        }
      />

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, company, email, phone or lead #…" className={`${inputClass} pl-9`} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <option value="ALL">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </div>

      {loading && leads.length === 0 ? (
        <div className="flex justify-center py-16 text-brand-600">
          <Spinner className="h-8 w-8" />
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <UserSquare2 className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="font-bold text-slate-900">No leads yet</h3>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Interest</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((l) => (
                <tr key={l.id} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs font-bold text-brand-600">{l.leadNumber}</div>
                    <div className="font-semibold text-slate-900">{l.companyName || l.clientName}</div>
                    {l.companyName && <div className="text-xs text-slate-500">{l.clientName}</div>}
                    <div className="text-[11px] text-slate-400">
                      {fmtDate(l.createdAt)} &middot; {l.source}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div>{l.email}</div>
                    <div>{l.phone}</div>
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-xs text-slate-600">
                    <div className="font-semibold text-slate-800">{l.serviceOfInterest || "—"}</div>
                    <div className="line-clamp-2 whitespace-pre-line">{l.projectDetails}</div>
                    {l.quotations && l.quotations.length > 0 && <div className="mt-1 text-brand-600">{l.quotations.map((q) => q.quotationNumber).join(", ")}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <select value={l.status} onChange={(e) => changeStatus(l, e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs">
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {label(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconButton title="Create quotation" icon={FileText} className="text-brand-600" onClick={() => router.push(`/admin/quotations?fromLead=${l.id}`)} />
                      <IconButton
                        title="Edit"
                        icon={Edit2}
                        onClick={() =>
                          setEditing({
                            id: l.id,
                            form: { clientName: l.clientName, companyName: l.companyName || "", email: l.email, phone: l.phone, serviceOfInterest: l.serviceOfInterest || "", projectDetails: l.projectDetails || "", timeline: l.timeline || "", source: l.source, status: l.status, estimatedValue: l.estimatedValue ? String(l.estimatedValue) : "", notes: l.notes || "" },
                          })
                        }
                      />
                      <IconButton title="Delete" icon={Trash2} className="text-rose-600" onClick={() => remove(l)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          title={editing.id ? "Edit lead" : "Add lead"}
          onClose={() => setEditing(null)}
          footer={
            <div className="space-y-2">
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button busy={saving} onClick={save}>
                  Save
                </Button>
              </div>
            </div>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Name *</label>
              <input value={editing.form.clientName} onChange={(e) => set("clientName", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Company</label>
              <input value={editing.form.companyName} onChange={(e) => set("companyName", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" value={editing.form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone / WhatsApp *</label>
              <input value={editing.form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Service of interest</label>
              <input value={editing.form.serviceOfInterest} onChange={(e) => set("serviceOfInterest", e.target.value)} className={inputClass} placeholder="e.g. Website development" />
            </div>
            <div>
              <label className={labelClass}>Timeline</label>
              <input value={editing.form.timeline} onChange={(e) => set("timeline", e.target.value)} className={inputClass} placeholder="e.g. 1-3 months" />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={editing.form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Estimated value (&#8377;)</label>
              <input type="number" min="0" value={editing.form.estimatedValue} onChange={(e) => set("estimatedValue", e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Project details</label>
              <textarea rows={3} value={editing.form.projectDetails} onChange={(e) => set("projectDetails", e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Internal notes</label>
              <textarea rows={2} value={editing.form.notes} onChange={(e) => set("notes", e.target.value)} className={inputClass} />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
