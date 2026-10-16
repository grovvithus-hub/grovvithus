"use client";

import { useEffect, useState } from "react";
import { Copy, Mail, MessageSquare } from "lucide-react";
import { api, apiRaw, copyToClipboard, errorMessage, type DocType } from "./api";
import { Button, Modal, Spinner, inputClass, labelClass } from "@/components/ui/kit";

export type SendTab = "email" | "whatsapp";

interface Preview {
  email: { to: string; cc: string[]; subject: string; message: string };
  whatsapp: { phone: string; message: string };
  shareUrl: string;
  companyName: string;
  fileName: string;
  emailsEnabled: boolean;
}

export function SendDocumentDialog({
  type,
  id,
  label,
  initialTab,
  onClose,
  onSent,
}: {
  type: DocType;
  id: string;
  label: string;
  initialTab: SendTab;
  onClose: () => void;
  onSent: () => void;
}) {
  const [tab, setTab] = useState<SendTab>(initialTab);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadError, setLoadError] = useState("");

  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachPdf, setAttachPdf] = useState(true);
  const [includeLink, setIncludeLink] = useState(true);

  const [phone, setPhone] = useState("");
  const [waMessage, setWaMessage] = useState("");

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    api<Preview>(`/api/admin/documents/${type}/${id}/send-preview`)
      .then((p) => {
        setPreview(p);
        setTo(p.email.to);
        setCc(p.email.cc.join(", "));
        setSubject(p.email.subject);
        setMessage(p.email.message);
        setPhone(p.whatsapp.phone);
        setWaMessage(p.whatsapp.message);
      })
      .catch((e) => setLoadError(errorMessage(e)));
  }, [type, id]);

  const sendEmail = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await apiRaw(`/api/admin/documents/${type}/${id}/send-email`, { body: { to, cc, subject, message, attachPdf, includeLink } });
      setNotice({ kind: "ok", text: res.message || "Email sent" });
      onSent();
    } catch (e) {
      setNotice({ kind: "error", text: errorMessage(e, "Email could not be sent") });
    } finally {
      setBusy(false);
    }
  };

  const openWhatsApp = async () => {
    setBusy(true);
    setNotice(null);
    // Open the tab synchronously (popup blockers), then point it at WhatsApp once the server logged the send.
    const win = window.open("about:blank", "_blank");
    try {
      const res = await apiRaw(`/api/admin/documents/${type}/${id}/send-whatsapp`, { body: { phone, message: waMessage } });
      const url = (res as { whatsappUrl?: string }).whatsappUrl;
      if (url && win) win.location.href = url;
      else if (url) window.location.href = url;
      setNotice({ kind: "ok", text: "WhatsApp opened. Press send there to deliver it." });
      onSent();
    } catch (e) {
      win?.close();
      setNotice({ kind: "error", text: errorMessage(e, "Could not open WhatsApp") });
    } finally {
      setBusy(false);
    }
  };

  const tabClass = (t: SendTab) =>
    `flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tab === t ? "bg-brand-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`;

  return (
    <Modal title={`Send ${label}`} subtitle={preview ? `From ${preview.companyName}` : undefined} onClose={onClose} z={60}>
      {loadError && <p className="text-sm text-rose-600">{loadError}</p>}
      {!preview && !loadError && (
        <div className="flex justify-center py-8 text-brand-600">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {preview && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button className={tabClass("email")} onClick={() => setTab("email")}>
              <Mail className="h-4 w-4" /> Email
            </button>
            <button className={tabClass("whatsapp")} onClick={() => setTab("whatsapp")}>
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </button>
          </div>

          {tab === "email" ? (
            <div className="space-y-3">
              {!preview.emailsEnabled && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  Email sending is switched off on this server (set SMTP details and DISABLE_EMAILS=false in the environment). You can still copy the client link or use WhatsApp.
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>To</label>
                  <input value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} type="email" />
                </div>
                <div>
                  <label className={labelClass}>CC (comma separated)</label>
                  <input value={cc} onChange={(e) => setCc(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Message</label>
                <textarea rows={8} value={message} onChange={(e) => setMessage(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={attachPdf} onChange={(e) => setAttachPdf(e.target.checked)} /> Attach PDF ({preview.fileName})
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={includeLink} onChange={(e) => setIncludeLink(e.target.checked)} /> Include online view link
                </label>
              </div>
              <div className="flex justify-end">
                <Button busy={busy} onClick={sendEmail} disabled={!preview.emailsEnabled}>
                  Send email
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>WhatsApp number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="10-digit mobile, or with country code" />
              </div>
              <div>
                <label className={labelClass}>Message</label>
                <textarea rows={9} value={waMessage} onChange={(e) => setWaMessage(e.target.value)} className={inputClass} />
              </div>
              <div className="flex justify-end">
                <Button busy={busy} onClick={openWhatsApp}>
                  Open WhatsApp
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <div className="mb-1 font-semibold text-slate-700">Client link</div>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate">{preview.shareUrl}</code>
              <button
                className="flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 font-semibold hover:bg-white"
                onClick={async () => {
                  await copyToClipboard(preview.shareUrl);
                  setNotice({ kind: "ok", text: "Link copied" });
                }}
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
          </div>

          {notice && <p className={`text-sm ${notice.kind === "ok" ? "text-brand-600" : "text-rose-600"}`}>{notice.text}</p>}
        </div>
      )}
    </Modal>
  );
}
