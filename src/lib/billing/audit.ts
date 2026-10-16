import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import type { SessionUser } from "@/lib/session";
import { clientIp } from "@/lib/http";
import { escapeHtml } from "./format";
import { listBankAccounts, type BankAccount, type CompanyProfile } from "./company";

export const BANK_AUDIT_ACTION = "BILLING_BANK_DETAILS_CHANGED";

export async function logActivity(user: SessionUser | null, action: string, details: string, req?: Request) {
  try {
    await prisma.auditLog.create({
      data: { userId: user?.id ?? null, userEmail: user?.email ?? null, action, details, ipAddress: req ? clientIp(req) : null },
    });
  } catch (err) {
    console.error("[audit] Could not write audit entry:", err);
  }
}

/** Account numbers are never written to the audit log or alert emails in full. */
export const maskAccount = (n?: string | null) => (n ? `••••${n.slice(-4)}` : "—");

const describe = (a: BankAccount) =>
  `${a.label ? `${a.label}: ` : ""}${a.bankName || "Bank"} ${maskAccount(a.accountNumber)}${a.ifsc ? ` (IFSC ${a.ifsc})` : ""}`;

const FIELDS: [keyof BankAccount, string][] = [
  ["accountNumber", "account number"],
  ["ifsc", "IFSC"],
  ["bankName", "bank"],
  ["accountName", "account holder"],
  ["branch", "branch"],
  ["swift", "SWIFT"],
];

const show = (key: keyof BankAccount, v: unknown) =>
  key === "accountNumber" ? maskAccount(v as string) : (v as string) || "—";

/** Human-readable list of bank and UPI changes between two versions of a company. */
export const diffBankDetails = (before: CompanyProfile | null, after: CompanyProfile | null): string[] => {
  const prev = before ? listBankAccounts(before) : [];
  const next = after ? listBankAccounts(after) : [];
  const changes: string[] = [];

  for (const a of next) {
    const old = prev.find((p) => p.id === a.id);
    if (!old) {
      changes.push(`Added ${describe(a)}${a.isDefault ? " as default" : ""}`);
      continue;
    }
    const fieldChanges = FIELDS.filter(([k]) => (old[k] || "") !== (a[k] || "")).map(
      ([k, label]) => `${label} ${show(k, old[k])} → ${show(k, a[k])}`,
    );
    if (fieldChanges.length) changes.push(`Changed ${describe(old)}: ${fieldChanges.join(", ")}`);
    if (!old.isDefault && a.isDefault) changes.push(`Default account is now ${describe(a)}`);
  }
  for (const p of prev) {
    if (!next.some((a) => a.id === p.id)) changes.push(`Removed ${describe(p)}`);
  }

  const oldUpi = before?.upiId || null;
  const newUpi = after?.upiId || null;
  if (oldUpi !== newUpi) changes.push(`UPI ID ${oldUpi || "—"} → ${newUpi || "—"}`);
  return changes;
};

/**
 * Writes an audit entry and emails every super admin. Never throws: a failed alert must not block the save,
 * but it is logged so it can be noticed.
 */
export async function recordBankChanges(
  user: SessionUser,
  req: Request,
  companyId: string,
  companyName: string,
  changes: string[],
) {
  if (!changes.length) return;
  await logActivity(user, BANK_AUDIT_ACTION, JSON.stringify({ companyId, companyName, changedBy: user.email, changes }), req);
  // Alerts go out in the background so a slow mail server never delays the save.
  void sendBankChangeAlerts(req, companyName, changes, user.email, new Date());
}

async function sendBankChangeAlerts(req: Request, companyName: string, changes: string[], actor: string, at: Date) {
  try {
    const admins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN", isActive: true }, select: { email: true } });
    const recipients = [...new Set([...admins.map((a) => a.email), process.env.ADMIN_NOTIFY_EMAIL].filter(Boolean) as string[])];
    const when = at.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;color:#334155;line-height:1.6;">
        <h2 style="color:#b91c1c;margin:0 0 12px 0;">Bank details changed</h2>
        <p>The payment details for <strong>${escapeHtml(companyName)}</strong> were changed.
        These appear on quotations and invoices sent to clients.</p>
        <table style="font-size:14px;margin:12px 0;">
          <tr><td style="color:#64748b;padding-right:12px;">Changed by</td><td><strong>${escapeHtml(actor)}</strong></td></tr>
          <tr><td style="color:#64748b;padding-right:12px;">When</td><td>${escapeHtml(when)} IST</td></tr>
          <tr><td style="color:#64748b;padding-right:12px;">IP address</td><td>${escapeHtml(clientIp(req))}</td></tr>
        </table>
        <ul>${changes.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
        <p style="background:#fef2f2;border:1px solid #fecaca;padding:10px 12px;border-radius:6px;">
          If you did not expect this change, open <strong>Admin &rarr; Billing settings</strong> immediately and correct it
          before any invoice is sent.
        </p>
      </div>`;
    for (const to of recipients) {
      const result = await sendMail(to, `Alert: bank details changed for ${companyName}`, html, [], { fromName: "GrovvIthUs Security" });
      if (result.error) console.error(`[billing] Bank-change alert to ${to} failed:`, result.error);
    }
  } catch (err) {
    console.error("[billing] Could not send bank-change alerts:", err);
  }
}

/** Bank-change history for one company, newest first. */
export async function getBankChangeHistory(companyId: string) {
  const rows = await prisma.auditLog.findMany({
    where: { action: BANK_AUDIT_ACTION, details: { contains: `"companyId":"${companyId}"` } },
    orderBy: { timestamp: "desc" },
    take: 100,
  });
  return rows.map((r) => {
    let parsed: { changedBy?: string; changes?: string[] } = {};
    try {
      parsed = JSON.parse(r.details);
    } catch {
      /* older or malformed entry */
    }
    return { id: r.id, at: r.timestamp, changedBy: parsed.changedBy || "unknown", changes: parsed.changes || [], ipAddress: r.ipAddress };
  });
}
