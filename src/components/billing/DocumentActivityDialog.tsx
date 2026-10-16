"use client";

import { useEffect, useState } from "react";
import { api, errorMessage, type DocType } from "./api";
import type { PaymentEntry } from "./types";
import { Modal, Spinner } from "@/components/ui/kit";
import { fmtDate, inr } from "@/lib/billing/format";

interface Activity {
  logs: { id: string; channel: string; recipient: string; subject: string | null; status: string; errorMessage: string | null; sentAt: string }[];
  viewedAt: string | null;
  viewCount: number;
  acceptedAt: string | null;
  acceptedBy: string | null;
  payments: PaymentEntry[];
}

const logColor: Record<string, string> = { SENT: "text-brand-600", FAILED: "text-rose-600", QUEUED: "text-amber-600" };

export function DocumentActivityDialog({ type, id, label, onClose }: { type: DocType; id: string; label: string; onClose: () => void }) {
  const [data, setData] = useState<Activity | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Activity>(`/api/admin/documents/${type}/${id}/activity`).then(setData).catch((e) => setError(errorMessage(e)));
  }, [type, id]);

  const when = (d: string) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <Modal title="History" subtitle={label} onClose={onClose} z={60}>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {!data && !error && (
        <div className="flex justify-center py-8 text-brand-600">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {data && (
        <div className="space-y-5 text-sm">
          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Client activity</h4>
            <ul className="space-y-1 text-slate-700">
              <li>
                {data.viewedAt ? `Opened ${data.viewCount} time${data.viewCount === 1 ? "" : "s"}, first on ${when(data.viewedAt)}` : "Not opened by the client yet"}
              </li>
              {type === "quotations" && (
                <li>{data.acceptedAt ? `Accepted by ${data.acceptedBy} on ${when(data.acceptedAt)}` : "Not accepted yet"}</li>
              )}
            </ul>
          </section>

          {type === "invoices" && (
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Payments</h4>
              {data.payments.length === 0 ? (
                <p className="text-slate-500">No payments recorded.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {data.payments.map((p, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div>
                        <div className="font-semibold text-slate-900">{inr(p.amount)}</div>
                        <div className="text-xs text-slate-500">
                          {[p.method.replace("_", " "), p.reference, fmtDate(p.date), p.recordedBy ? `by ${p.recordedBy}` : ""].filter(Boolean).join(" · ")}
                        </div>
                        {p.notes && <div className="text-xs text-slate-400">{p.notes}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Messages</h4>
            {data.logs.length === 0 ? (
              <p className="text-slate-500">Nothing sent yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {data.logs.map((l) => (
                  <li key={l.id} className="px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">
                        {l.channel === "EMAIL" ? "Email" : "WhatsApp"} to {l.recipient}
                      </span>
                      <span className={`text-xs font-semibold ${logColor[l.status] || "text-slate-500"}`}>{l.status === "QUEUED" ? "Opened in WhatsApp" : l.status}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {when(l.sentAt)}
                      {l.subject ? ` · ${l.subject}` : ""}
                    </div>
                    {l.errorMessage && <div className="text-xs text-rose-600">{l.errorMessage}</div>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}
