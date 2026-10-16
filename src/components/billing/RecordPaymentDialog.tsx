"use client";

import { useState } from "react";
import { api, errorMessage } from "./api";
import type { Invoice } from "./types";
import { Button, Modal, inputClass, labelClass } from "@/components/ui/kit";
import { inr, localDateInput } from "@/lib/billing/format";

export const PAYMENT_METHODS = ["BANK_TRANSFER", "UPI", "CHEQUE", "CASH", "CARD", "OTHER"];

export function RecordPaymentDialog({
  invoice,
  onClose,
  onRecorded,
}: {
  invoice: Invoice;
  onClose: () => void;
  onRecorded: (invoice: Invoice, sendReceipt: boolean) => void;
}) {
  const balance = Math.max(0, Number(invoice.totalAmount) - Number(invoice.amountPaid || 0));
  const [amount, setAmount] = useState(String(Math.round(balance * 100) / 100));
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(localDateInput());
  const [notes, setNotes] = useState("");
  const [sendReceipt, setSendReceipt] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const value = parseFloat(amount);
    if (!(value > 0)) return setError("Enter an amount greater than 0.");
    if (value > balance + 0.005) return setError(`Amount is more than the balance due (${inr(balance)}).`);
    setSaving(true);
    setError("");
    try {
      const updated = await api<Invoice>(`/api/admin/invoices/${invoice.id}/record-payment`, {
        body: { paymentAmount: value, paymentMethod: method, paymentReference: reference, paymentDate: date, notes },
      });
      onRecorded(updated, sendReceipt);
    } catch (err) {
      setError(errorMessage(err, "Could not record the payment"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Record payment"
      subtitle={`${invoice.invoiceNumber} · Balance due ${inr(balance)}`}
      onClose={onClose}
      size="sm"
      z={60}
      footer={
        <div className="space-y-2">
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button busy={saving} onClick={submit}>
              Record payment
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Amount received (&#8377;)</label>
            <input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Date received</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>UTR / reference</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} placeholder="Optional" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="Optional" />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={sendReceipt} onChange={(e) => setSendReceipt(e.target.checked)} />
          Offer to send a payment receipt to the client afterwards
        </label>
      </div>
    </Modal>
  );
}
