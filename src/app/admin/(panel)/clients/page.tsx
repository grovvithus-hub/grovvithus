"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit2, Plus, Search, Trash2, Users } from "lucide-react";
import { api, errorMessage } from "@/components/billing/api";
import type { BillingClient } from "@/components/billing/types";
import { useDialog } from "@/components/ui/DialogProvider";
import { Button, IconButton, Modal, PageHeader, Spinner, inputClass, labelClass } from "@/components/ui/kit";
import { GST_STATES } from "@/lib/billing/calc";

const empty = { name: "", company: "", email: "", phone: "", gstin: "", billingAddress: "", stateCode: "" };

export default function ClientsPage() {
  const { confirm, alert } = useDialog();
  const [clients, setClients] = useState<BillingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ id?: string; form: typeof empty } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setClients(await api<BillingClient[]>(`/api/admin/clients${search ? `?search=${encodeURIComponent(search)}` : ""}`));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const f = editing.form;
      const body = { ...f, state: f.stateCode ? GST_STATES[f.stateCode] : null };
      if (editing.id) await api(`/api/admin/clients/${editing.id}`, { method: "PUT", body });
      else await api("/api/admin/clients", { body });
      setEditing(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: BillingClient) => {
    if (!(await confirm({ title: "Delete client", message: `Delete ${c.company || c.name}? Existing documents keep their own copy of the details.`, confirmText: "Delete", variant: "danger" }))) return;
    try {
      await api(`/api/admin/clients/${c.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      await alert({ title: "Could not delete", message: errorMessage(err), variant: "error" });
    }
  };

  const set = (k: keyof typeof empty, v: string) => setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Saved customers for the Billed To picker, with GSTIN and state so tax is worked out correctly."
        action={
          <Button onClick={() => setEditing({ form: { ...empty } })} className="bg-white !text-ink hover:!bg-lime-soft">
            <Plus className="h-4 w-4" /> Add client
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, company, email, phone or GSTIN…" className={`${inputClass} pl-9`} />
      </div>

      {loading && clients.length === 0 ? (
        <div className="flex justify-center py-16 text-brand-600">
          <Spinner className="h-8 w-8" />
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <Users className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="font-bold text-slate-900">No clients yet</h3>
          <p className="mt-1 text-xs text-slate-400">Add one here, or tick &ldquo;Save this client&rdquo; when creating a quotation.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">GSTIN / State</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{c.company || c.name}</div>
                    {c.company && <div className="text-xs text-slate-500">{c.name}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div>{c.email}</div>
                    <div>{c.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div className="font-mono">{c.gstin || "—"}</div>
                    <div>{c.state || ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconButton
                        title="Edit"
                        icon={Edit2}
                        onClick={() =>
                          setEditing({
                            id: c.id,
                            form: { name: c.name, company: c.company || "", email: c.email || "", phone: c.phone || "", gstin: c.gstin || "", billingAddress: c.billingAddress || "", stateCode: c.stateCode || "" },
                          })
                        }
                      />
                      <IconButton title="Delete" icon={Trash2} className="text-rose-600" onClick={() => remove(c)} />
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
          title={editing.id ? "Edit client" : "Add client"}
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
              <label className={labelClass}>Contact person *</label>
              <input value={editing.form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Company</label>
              <input value={editing.form.company} onChange={(e) => set("company", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={editing.form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone / WhatsApp</label>
              <input value={editing.form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>GSTIN</label>
              <input value={editing.form.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} className={inputClass} placeholder="Leave empty if unregistered" />
            </div>
            <div>
              <label className={labelClass}>State (for GST)</label>
              <select value={editing.form.stateCode} onChange={(e) => set("stateCode", e.target.value)} className={inputClass}>
                <option value="">Auto from GSTIN</option>
                {Object.entries(GST_STATES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name} ({code})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Billing address</label>
              <textarea rows={3} value={editing.form.billingAddress} onChange={(e) => set("billingAddress", e.target.value)} className={inputClass} />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
