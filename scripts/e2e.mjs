// End-to-end checks against a running server: node scripts/e2e.mjs [baseUrl]
// Uses ADMIN_EMAIL / ADMIN_PASSWORD / CRON_SECRET from .env. Never prints secrets.
import "dotenv/config";

const BASE = process.argv[2] || "http://localhost:3100";
let passed = 0;
let failed = 0;
let cookie = "";

const check = (name, cond, extra = "") => {
  if (cond) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name} ${extra}`);
  }
};

async function call(path, { method, body, headers = {}, raw = false, auth = true } = {}) {
  const res = await fetch(BASE + path, {
    method: method || (body !== undefined ? "POST" : "GET"),
    headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(auth && cookie ? { Cookie: cookie } : {}), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  if (raw) return res;
  let json = {};
  try {
    json = await res.json();
  } catch {
    /* not json */
  }
  return { status: res.status, json, res };
}

const item = (description, unitPrice, quantity = 1, taxPercent = 18) => ({ description, unitPrice, quantity, taxPercent, hsnSac: "998314", unit: "Project" });

async function main() {
  console.log("Auth and access control");
  let r = await call("/api/admin/quotations", { auth: false });
  check("admin API blocks signed-out requests (401)", r.status === 401);
  r = await call("/admin", { raw: true, auth: false });
  check("admin page redirects signed-out users to login", [302, 307, 308].includes(r.status) && (r.headers.get("location") || "").includes("/admin/login"));
  r = await call("/api/auth/login", { body: { email: process.env.ADMIN_EMAIL, password: "definitely-wrong-password" } });
  check("wrong password rejected with a generic message", r.status === 401 && /wrong/i.test(r.json.message || ""));
  r = await call("/api/auth/login", { body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } });
  check("login succeeds", r.status === 200 && r.json.data?.role === "SUPER_ADMIN");
  const setCookie = r.res.headers.get("set-cookie") || "";
  cookie = setCookie.split(";")[0];
  check("session cookie is HttpOnly + SameSite", /HttpOnly/i.test(setCookie) && /SameSite=lax/i.test(setCookie));
  r = await call("/api/admin/quotations", { method: "POST", body: {}, headers: { Origin: "https://evil.example" } });
  check("cross-site POST is blocked (403)", r.status === 403);

  console.log("Company, client");
  r = await call("/api/admin/companies");
  const company = r.json.data?.[0];
  check("starter company exists", !!company?.id);
  r = await call(`/api/admin/companies/${company.id}`, {
    method: "PUT",
    body: {
      name: "GrovvIthUs", gstin: "36AAGCG6536J2ZA", pan: "AAGCG6536J", email: "hello@grovvithus.local", phone: "+91 98765 43210",
      addressLine1: "Plot 1, Tech Park", city: "Hyderabad", state: "Telangana", stateCode: "36", pincode: "500072", country: "India",
      upiId: "grovvithus@okbank",
      bankAccounts: [{ label: "Current", accountName: "GrovvIthUs", bankName: "Test Bank", accountNumber: "1234567890", ifsc: "TEST0001234", branch: "Hyderabad", isDefault: true }],
      quotationTerms: "50% advance. Valid for 15 days.", invoiceTerms: "Pay by due date.",
    },
  });
  check("company saved with bank account + UPI", r.status === 200 && r.json.data?.bankAccountNumber === "1234567890", JSON.stringify(r.json).slice(0, 200));
  r = await call(`/api/admin/companies/${company.id}`, { method: "PUT", body: { name: "GrovvIthUs", gstin: "BADGSTIN", bankAccounts: [] } });
  check("invalid GSTIN rejected", r.status === 400 && /GSTIN/i.test(r.json.message || ""));
  r = await call(`/api/admin/companies/${company.id}/bank-history`);
  check("bank change was recorded in history", r.status === 200 && r.json.data.length >= 1);

  r = await call("/api/admin/clients", { body: { name: "Asha Rao", company: "Asha Traders", email: "asha@example.com", phone: "9876543210", gstin: "36ABCDE1234F1Z5", billingAddress: "12 Market Rd, Hyderabad" } });
  check("client created", r.status === 201);
  const client = r.json.data;

  console.log("Quotation: GST maths");
  const base = { clientId: client.id, clientName: "Asha Rao", clientCompany: "Asha Traders", clientEmail: "asha@example.com", clientPhone: "9876543210", clientGst: "36ABCDE1234F1Z5", items: [item("Website development", 10000), item("SEO (monthly)", 5000, 2, 18)], discountAmount: 1000, validUntil: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10) };
  r = await call("/api/admin/quotations", { body: base });
  const q = r.json.data;
  check("quotation created as DRAFT with QUO-year-0001 style number", r.status === 201 && /^QUO-\d{4}-\d{4}$/.test(q.quotationNumber) && q.status === "DRAFT", JSON.stringify(r.json).slice(0, 200));
  check("same-state client gets CGST + SGST (no IGST)", q.taxType === "CGST_SGST" && q.igstAmount === 0 && q.cgstAmount === q.sgstAmount && q.cgstAmount > 0);
  // subtotal 20000, discount 1000 -> taxable 19000, 18% = 3420 -> total 22420
  check("totals: subtotal 20000, discount 1000, tax 3420, total 22420", q.subTotal === 20000 && q.discountAmount === 1000 && q.taxAmount === 3420 && q.totalAmount === 22420, `${q.subTotal}/${q.taxAmount}/${q.totalAmount}`);
  check("amount in words filled", /Twenty Two Thousand Four Hundred Twenty Rupees Only/.test(q.amountInWords), q.amountInWords);
  r = await call("/api/admin/quotations", { body: { ...base, clientGst: "27ABCDE1234F1Z5", clientId: null } });
  const q2 = r.json.data;
  check("other-state client gets IGST", q2.taxType === "IGST" && q2.igstAmount === 3420 && q2.cgstAmount === 0);
  check("second number increments", q2.quotationNumber !== q.quotationNumber && Number(q2.quotationNumber.slice(-4)) === Number(q.quotationNumber.slice(-4)) + 1);
  r = await call("/api/admin/quotations", { body: { ...base, items: [] } });
  check("quotation without items rejected", r.status === 400);
  r = await call("/api/admin/quotations", { body: { ...base, clientEmail: "not-an-email" } });
  check("invalid email rejected", r.status === 400);

  console.log("PDF, send, share");
  r = await call(`/api/admin/documents/quotations/${q.id}/pdf`, { raw: true });
  const pdf = Buffer.from(await r.arrayBuffer());
  check("PDF renders (%PDF header, > 5 KB)", r.status === 200 && pdf.subarray(0, 4).toString() === "%PDF" && pdf.length > 5000, `${r.status} ${pdf.length}`);
  r = await call(`/api/admin/documents/quotations/${q.id}/send-preview`);
  check("send preview returns drafts + share link", r.status === 200 && r.json.data.email.subject.includes(q.quotationNumber) && /\/p\//.test(r.json.data.shareUrl));
  const token = r.json.data.shareUrl.split("/p/")[1];
  r = await call(`/api/admin/documents/quotations/${q.id}/send-email`, { body: {} });
  check("email without SMTP fails clearly (502, nothing marked sent)", r.status === 502 && /turned off|SMTP/i.test(r.json.message || ""), r.json.message);
  r = await call(`/api/admin/documents/quotations/${q.id}/send-whatsapp`, { body: { phone: "9876543210" } });
  check("WhatsApp link built for +91 number", r.status === 200 && r.json.whatsappUrl.startsWith("https://wa.me/919876543210?text="));
  r = await call(`/api/admin/quotations/${q.id}`);
  check("quotation moved to SENT after WhatsApp", r.json.data.status === "SENT" && r.json.data.sentViaWhatsApp === true);

  console.log("Public client link");
  r = await call(`/api/public/doc/${token}`, { auth: false });
  check("public view works without login", r.status === 200 && r.json.data.number === q.quotationNumber && r.json.data.canAccept === true);
  r = await call(`/api/admin/quotations/${q.id}`);
  check("client view marks quotation VIEWED (count 1)", r.json.data.status === "VIEWED" && r.json.data.viewCount === 1);
  r = await call(`/api/public/doc/${token}`);
  r = await call(`/api/admin/quotations/${q.id}`);
  check("admin preview does not count as a client view", r.json.data.viewCount === 1);
  r = await call("/api/public/doc/not-a-real-token-123456789", { auth: false });
  check("bad token gives 404", r.status === 404);
  r = await call(`/api/public/doc/${token}/pdf`, { raw: true, auth: false });
  check("public PDF works", r.status === 200 && (r.headers.get("content-type") || "").includes("pdf"));
  r = await call(`/api/public/doc/${token}/accept`, { body: { name: "A" }, auth: false });
  check("accept needs a real name", r.status === 400);
  r = await call(`/api/public/doc/${token}/accept`, { body: { name: "Asha Rao" }, auth: false });
  check("client accepts online", r.status === 200 && r.json.data.status === "ACCEPTED" && r.json.data.acceptedBy === "Asha Rao");
  r = await call(`/api/public/doc/${token}/accept`, { body: { name: "Someone Else" }, auth: false });
  check("second accept is harmless (keeps first acceptor)", r.status === 200 && r.json.data.acceptedBy === "Asha Rao");
  r = await call("/api/admin/documents/quotations/" + q.id + "/activity");
  check("activity shows view + acceptance + messages", r.json.data.viewCount >= 1 && r.json.data.acceptedBy === "Asha Rao" && r.json.data.logs.length >= 2);

  console.log("Convert to invoice");
  r = await call(`/api/admin/quotations/${q.id}/convert`, { body: {} });
  const inv = r.json.data;
  check("convert creates INV-year-0001 style invoice, UNPAID", r.status === 201 && /^INV-\d{4}-\d{4}$/.test(inv.invoiceNumber) && inv.paymentStatus === "UNPAID" && inv.totalAmount === 22420, JSON.stringify(r.json).slice(0, 200));
  r = await call(`/api/admin/quotations/${q.id}/convert`, { body: {} });
  check("converting twice returns the same invoice", r.status === 200 && r.json.data.id === inv.id);
  r = await call(`/api/admin/quotations/${q.id}`, { method: "PUT", body: base });
  check("converted quotation cannot be edited", r.status === 400);
  r = await call(`/api/admin/quotations/${q.id}`, { method: "DELETE" });
  check("quotation with an invoice cannot be deleted", r.status === 400);

  console.log("Payments");
  r = await call(`/api/admin/invoices/${inv.id}/record-payment`, { body: { paymentAmount: 30000 } });
  check("overpayment rejected", r.status === 400 && /more than the balance/i.test(r.json.message || ""));
  r = await call(`/api/admin/invoices/${inv.id}/record-payment`, { body: { paymentAmount: 0 } });
  check("zero payment rejected", r.status === 400);
  r = await call(`/api/admin/invoices/${inv.id}/record-payment`, { body: { paymentAmount: 10000, paymentMethod: "UPI", paymentReference: "UTR123" } });
  check("partial payment -> PARTIALLY_PAID, balance 12420", r.status === 200 && r.json.data.paymentStatus === "PARTIALLY_PAID" && r.json.data.balanceDue === 12420, JSON.stringify(r.json).slice(0, 200));
  r = await call(`/api/admin/invoices/${inv.id}/cancel`, { body: {} });
  check("invoice with payments cannot be cancelled", r.status === 400);
  r = await call(`/api/admin/invoices/${inv.id}`, { method: "DELETE" });
  check("invoice with payments cannot be deleted", r.status === 400);
  const [a, b] = await Promise.all([
    call(`/api/admin/invoices/${inv.id}/record-payment`, { body: { paymentAmount: 12420 } }),
    call(`/api/admin/invoices/${inv.id}/record-payment`, { body: { paymentAmount: 12420 } }),
  ]);
  check("two simultaneous full payments: exactly one succeeds", [a.status, b.status].filter((s) => s === 200).length === 1, `${a.status}/${b.status}`);
  r = await call(`/api/admin/invoices/${inv.id}`);
  check("invoice is PAID with balance 0 and 2 payments logged", r.json.data.paymentStatus === "PAID" && r.json.data.balanceDue === 0 && r.json.data.payments.length === 2);
  r = await call(`/api/admin/documents/invoices/${inv.id}/pdf`, { raw: true });
  check("paid invoice PDF renders", r.status === 200 && Buffer.from(await r.arrayBuffer()).length > 5000);

  console.log("Invoice statuses");
  const past = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
  const issued = new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10);
  r = await call("/api/admin/invoices", { body: { ...base, items: [item("Hosting setup", 2000)], discountAmount: 0, issueDate: issued, dueDate: past } });
  const od = r.json.data;
  check("past-due invoice is created OVERDUE", r.status === 201 && od.paymentStatus === "OVERDUE");
  r = await call("/api/admin/invoices", { body: { ...base, items: [item("Draft work", 500)], discountAmount: 0, isDraft: true, issueDate: issued, dueDate: past } });
  check("draft invoice never becomes overdue", r.json.data.paymentStatus !== "OVERDUE");
  r = await call("/api/admin/invoices", { body: { ...base, items: [item("Free trial", 0)], discountAmount: 0 } });
  check("zero-value invoice is PAID", r.json.data.paymentStatus === "PAID");
  r = await call("/api/admin/invoices", { body: { ...base, items: [item("Setup", 1000)], discountAmount: 0, issueDate: past, dueDate: issued } });
  check("due date before invoice date rejected", r.status === 400);
  r = await call("/api/admin/invoices", { body: { ...base, items: [item("Advance job", 1000)], discountAmount: 0, amountPaid: 500, paymentMethod: "CASH" } });
  check("advance recorded on create -> PARTIALLY_PAID", r.json.data.paymentStatus === "PARTIALLY_PAID" && r.json.data.amountPaid === 500);
  r = await call(`/api/admin/invoices/${r.json.data.id}/cancel`, { body: {} });
  check("invoice with an advance cannot be cancelled", r.status === 400);
  r = await call("/api/admin/invoices", { body: { ...base, items: [item("Mistake", 100)], discountAmount: 0 } });
  const mistake = r.json.data;
  r = await call(`/api/admin/invoices/${mistake.id}/cancel`, { body: {} });
  check("unpaid invoice can be cancelled", r.status === 200 && r.json.data.paymentStatus === "CANCELLED");
  r = await call(`/api/admin/invoices/${mistake.id}/record-payment`, { body: { paymentAmount: 10 } });
  check("cancelled invoice takes no payments", r.status === 400);
  r = await call(`/api/admin/invoices?status=OVERDUE`);
  check("status filter returns overdue invoices", r.json.data.some((i) => i.id === od.id));
  r = await call(`/api/admin/invoices?search=${encodeURIComponent("Asha Traders")}`);
  check("search by client company works", r.json.data.length >= 3);

  console.log("Expiry job");
  r = await call("/api/admin/quotations", { body: { ...base, validUntil: past } });
  const old = r.json.data;
  await call(`/api/admin/documents/quotations/${old.id}/send-whatsapp`, { body: { phone: "9876543210" } });
  r = await call("/api/cron/refresh-statuses", { body: {}, auth: false, headers: { Authorization: "Bearer wrong" } });
  check("cron rejects a wrong secret", r.status === 401);
  r = await call("/api/cron/refresh-statuses", { body: {}, auth: false, headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
  check("cron refresh succeeds and expired the old sent quotation", r.status === 200 && r.json.data.quotationsExpired >= 1, JSON.stringify(r.json));
  r = await call(`/api/admin/quotations/${old.id}`);
  check("old quotation is EXPIRED", r.json.data.status === "EXPIRED");
  const oldToken = (await call(`/api/admin/documents/quotations/${old.id}/share-link`, { body: {} })).json.data.url.split("/p/")[1];
  r = await call(`/api/public/doc/${oldToken}/accept`, { body: { name: "Late Client" }, auth: false });
  check("expired quotation cannot be accepted", r.status === 400);

  console.log("Leads and website enquiry");
  r = await call("/api/public/inquiry", { body: { clientName: "Ravi", email: "ravi@example.com", phone: "9000011111", intent: "DEMO", serviceOfInterest: "Shopify store" }, auth: false });
  check("website enquiry creates a lead", r.status === 201 && /^LEAD-\d{4}-\d{4}$/.test(r.json.data?.leadNumber || ""), JSON.stringify(r.json));
  r = await call("/api/public/inquiry", { body: { clientName: "Bot", email: "bot@example.com", phone: "9000022222", website: "http://spam" }, auth: false });
  check("honeypot is silently ignored", r.status === 200);
  r = await call("/api/public/inquiry", { body: { clientName: "", email: "x", phone: "1" }, auth: false });
  check("bad enquiry rejected", r.status === 400);
  r = await call("/api/admin/leads?search=Ravi");
  const lead = r.json.data[0];
  check("lead visible to admin with DEMO note", !!lead && /demo/i.test(lead.projectDetails || ""));
  r = await call("/api/admin/quotations", { body: { ...base, leadId: lead.id, clientId: null } });
  r = await call(`/api/admin/leads/${lead.id}`);
  check("creating a quotation moves the lead to PROPOSAL_SENT", r.json.data.status === "PROPOSAL_SENT");

  console.log("Pages");
  for (const p of ["/", "/admin/login", `/p/${token}`]) {
    r = await call(p, { raw: true, auth: false });
    check(`GET ${p.startsWith("/p/") ? "/p/<token>" : p} renders`, r.status === 200);
  }
  for (const p of ["/admin", "/admin/quotations", "/admin/invoices", "/admin/clients", "/admin/leads", "/admin/settings/billing"]) {
    r = await call(p, { raw: true });
    check(`GET ${p} renders for signed-in admin`, r.status === 200);
  }
  r = await call("/api/auth/logout", { body: {} });
  check("logout works", r.status === 200);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
