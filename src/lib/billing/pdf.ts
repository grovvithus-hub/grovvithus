import PDFDocument from "pdfkit";
import { readFileSync } from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { calculateBilling, type BillingTotals } from "./calc";
import { fmtDate, inr } from "./format";
import { getCompanyForDocument, resolveBankAccount, type BankAccount, type CompanyProfile } from "./company";

export type BillingDocKind = "quotation" | "invoice";

// DejaVu Sans has the rupee glyph; PDFKit's built-in Helvetica does not.
const FONT_DIR = path.join(process.cwd(), "assets", "fonts");
const FONT_REGULAR = path.join(FONT_DIR, "DejaVuSansCondensed.ttf");
const FONT_BOLD = path.join(FONT_DIR, "DejaVuSansCondensed-Bold.ttf");

const PAGE = { left: 36, right: 559, width: 523, bottom: 770 };
const COLOR = {
  brand: "#0b3d2e",
  brandDark: "#0f1412",
  text: "#0f172a",
  muted: "#64748b",
  body: "#334155",
  line: "#e2e8f0",
  cardBg: "#eaf4ef",
  softBg: "#f8fafc",
  paid: "#14705a",
  due: "#d97706",
  overdue: "#e11d48",
};

let defaultLogoCache: Buffer | null | undefined;
/** The GrovvIthUs mark, used when the company has not uploaded its own logo. */
const defaultLogo = (): Buffer | null => {
  if (defaultLogoCache === undefined) {
    try {
      defaultLogoCache = readFileSync(path.join(process.cwd(), "public", "brand", "logo-mark.png"));
    } catch {
      defaultLogoCache = null;
    }
  }
  return defaultLogoCache;
};

const dataUrlToBuffer = (dataUrl?: string | null): Buffer | null => {
  const match = /^data:image\/(png|jpe?g);base64,(.+)$/.exec(dataUrl || "");
  return match ? Buffer.from(match[2], "base64") : null;
};

export const companyAddressLines = (c: CompanyProfile): string[] =>
  [
    [c.addressLine1, c.addressLine2].filter(Boolean).join(", "),
    [c.city, c.state].filter(Boolean).join(", ") +
      (c.pincode ? ` - ${c.pincode}` : "") +
      (c.country && c.country !== "India" ? `, ${c.country}` : ""),
  ].filter((l) => l.trim());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const documentTotals = (doc: any, company: CompanyProfile): BillingTotals =>
  calculateBilling({
    items: Array.isArray(doc.items) ? doc.items : [],
    taxPercent: doc.taxPercent,
    discountAmount: doc.discountAmount,
    additionalCharges: doc.additionalCharges,
    placeOfSupplyCode: doc.placeOfSupplyCode,
    clientGst: doc.clientGst,
    supplierStateCode: company.stateCode,
  });

export const upiPaymentUri = (company: CompanyProfile, amount: number, note: string) =>
  `upi://pay?pa=${encodeURIComponent(company.upiId || "")}&pn=${encodeURIComponent(company.bankAccountName || company.name)}` +
  `&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

interface DrawContext {
  kind: BillingDocKind;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  record: any;
  company: CompanyProfile;
  bank: BankAccount | null;
  totals: BillingTotals;
  number: string;
  amountPaid: number;
  balanceDue: number;
  upiQr: Buffer | null;
}

/** Renders a quotation or invoice to a PDF buffer (nothing is written to disk). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function renderDocumentPdf(kind: BillingDocKind, record: any, companyOverride?: CompanyProfile): Promise<Buffer> {
  const company = companyOverride || (await getCompanyForDocument(record.companyId));
  const totals = documentTotals(record, company);
  const isInvoice = kind === "invoice";
  const number: string = isInvoice ? record.invoiceNumber : record.quotationNumber;
  const amountPaid = isInvoice ? Number(record.amountPaid || 0) : 0;
  const balanceDue = isInvoice ? Math.max(0, Math.round((totals.totalAmount - amountPaid) * 100) / 100) : 0;

  let upiQr: Buffer | null = null;
  // UPI QR only on invoices: a quotation's total is not necessarily what is payable now (e.g. a 30% advance).
  if (company.upiId && isInvoice && balanceDue > 0 && record.paymentStatus !== "CANCELLED") {
    upiQr = await QRCode.toBuffer(upiPaymentUri(company, balanceDue, number), { margin: 1, width: 220 });
  }

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 36, bufferPages: true, info: { Title: number, Author: company.name } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.registerFont("R", FONT_REGULAR);
    doc.registerFont("B", FONT_BOLD);
    try {
      const bank = resolveBankAccount(company, record.bankAccountId);
      draw(doc, { kind, record, company, bank, totals, number, amountPaid, balanceDue, upiQr });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function draw(doc: PDFKit.PDFDocument, ctx: DrawContext) {
  const { kind, record, company, bank, totals, number, amountPaid, balanceDue, upiQr } = ctx;
  const isInvoice = kind === "invoice";
  const isIgst = totals.taxType === "IGST";
  const hasTax = totals.taxAmount > 0;

  // ---------- Header ----------
  const heading = isInvoice ? (hasTax ? "Tax Invoice" : "Invoice") : record.title || "Quotation";
  doc.font("B").fontSize(isInvoice ? 20 : 17).fillColor(COLOR.brand).text(heading, PAGE.left, 36, { width: 340 });

  const logo = dataUrlToBuffer(company.logoDataUrl) ?? defaultLogo();
  if (logo) {
    try {
      doc.image(logo, PAGE.right - 140, 32, { fit: [140, 56], align: "right" });
    } catch {
      /* unreadable image: skip */
    }
  }

  let y = Math.max(doc.y + 8, 72);
  const meta: [string, string][] = [[isInvoice ? "Invoice No" : "Quotation No", number]];
  meta.push([isInvoice ? "Invoice Date" : "Quotation Date", fmtDate(isInvoice ? record.issueDate : record.createdAt)]);
  if (isInvoice && record.dueDate) meta.push(["Due Date", fmtDate(record.dueDate)]);
  if (!isInvoice && record.validUntil) meta.push(["Valid Till", fmtDate(record.validUntil)]);
  if (record.poNumber) meta.push(["PO / Ref No", record.poNumber]);
  meta.push(["Status", String((isInvoice ? record.paymentStatus : record.status) || (isInvoice ? "UNPAID" : "DRAFT")).replace("_", " ")]);

  doc.fontSize(8.5);
  for (const [label, value] of meta) {
    doc.font("R").fillColor(COLOR.muted).text(label, PAGE.left, y, { width: 80 });
    doc.font("B").fillColor(COLOR.text).text(value, PAGE.left + 82, y, { width: 220 });
    y += 13;
  }

  // ---------- Billed By / Billed To ----------
  y += 8;
  const cardW = (PAGE.width - 12) / 2;
  const byLines = [
    ...companyAddressLines(company),
    company.gstin ? `GSTIN: ${company.gstin}` : "",
    company.pan ? `PAN: ${company.pan}` : "",
    company.email ? `Email: ${company.email}` : "",
    company.phone ? `Phone: ${company.phone}` : "",
  ].filter(Boolean);
  const toLines = [
    record.clientCompany && record.clientName !== record.clientCompany ? `Attn: ${record.clientName}` : "",
    isInvoice ? record.billingAddress : record.clientAddress,
    record.clientGst ? `GSTIN: ${record.clientGst}` : "",
    record.clientEmail ? `Email: ${record.clientEmail}` : "",
    record.clientPhone ? `Phone: ${record.clientPhone}` : "",
  ].filter(Boolean) as string[];

  const cardHeight = (name: string, lines: string[]) => {
    doc.font("B").fontSize(9.5);
    let h = 30 + doc.heightOfString(name, { width: cardW - 24 });
    doc.font("R").fontSize(8);
    for (const l of lines) h += doc.heightOfString(l, { width: cardW - 24 }) + 2;
    return h + 10;
  };
  const cardH = Math.max(cardHeight(company.name, byLines), cardHeight(record.clientCompany || record.clientName || "", toLines), 80);
  const drawCard = (x: number, title: string, name: string, lines: string[]) => {
    doc.roundedRect(x, y, cardW, cardH, 6).fill(COLOR.cardBg);
    doc.font("B").fontSize(10.5).fillColor(COLOR.brand).text(title, x + 12, y + 10);
    doc.font("B").fontSize(9.5).fillColor(COLOR.brandDark).text(name, x + 12, y + 26, { width: cardW - 24 });
    doc.font("R").fontSize(8).fillColor(COLOR.body);
    for (const l of lines) doc.text(l, { width: cardW - 24, lineGap: 1 });
  };
  drawCard(PAGE.left, isInvoice ? "Billed By" : "Quotation From", company.name, byLines);
  drawCard(PAGE.left + cardW + 12, isInvoice ? "Billed To" : "Quotation For", record.clientCompany || record.clientName || "Client", toLines);
  y += cardH + 8;

  if (totals.placeOfSupply) {
    doc.font("R").fontSize(8).fillColor(COLOR.muted).text("Place of Supply: ", PAGE.left, y, { continued: true });
    doc.font("B").fillColor(COLOR.text).text(`${totals.placeOfSupply} (${totals.placeOfSupplyCode})`);
    y = doc.y + 8;
  }

  // ---------- Items table ----------
  type Align = "left" | "center" | "right";
  const cols: { key: string; label: string; w: number; align: Align }[] = isIgst
    ? [
        { key: "item", label: "Item", w: 160, align: "left" },
        { key: "hsn", label: "HSN/SAC", w: 48, align: "center" },
        { key: "gst", label: "GST", w: 32, align: "center" },
        { key: "qty", label: "Qty", w: 40, align: "center" },
        { key: "rate", label: "Rate", w: 60, align: "right" },
        { key: "amount", label: "Amount", w: 60, align: "right" },
        { key: "igst", label: "IGST", w: 55, align: "right" },
        { key: "total", label: "Total", w: 68, align: "right" },
      ]
    : [
        { key: "item", label: "Item", w: 140, align: "left" },
        { key: "hsn", label: "HSN/SAC", w: 44, align: "center" },
        { key: "gst", label: "GST", w: 30, align: "center" },
        { key: "qty", label: "Qty", w: 36, align: "center" },
        { key: "rate", label: "Rate", w: 56, align: "right" },
        { key: "amount", label: "Amount", w: 58, align: "right" },
        { key: "cgst", label: "CGST", w: 48, align: "right" },
        { key: "sgst", label: "SGST", w: 48, align: "right" },
        { key: "total", label: "Total", w: 63, align: "right" },
      ];
  const PAD = 4;

  const drawTableHeader = () => {
    doc.roundedRect(PAGE.left, y, PAGE.width, 22, 4).fill(COLOR.brand);
    let x = PAGE.left;
    doc.font("B").fontSize(8).fillColor("#ffffff");
    for (const c of cols) {
      doc.text(c.label, x + PAD, y + 7, { width: c.w - PAD * 2, align: c.align });
      x += c.w;
    }
    y += 26;
  };
  drawTableHeader();

  totals.items.forEach((it, idx) => {
    const itemText = `${idx + 1}. ${it.description}`;
    doc.font("B").fontSize(8);
    let rowH = doc.heightOfString(itemText, { width: cols[0].w - PAD * 2 });
    if (it.details) {
      doc.font("R").fontSize(7.5);
      rowH += 2 + doc.heightOfString(it.details, { width: cols[0].w - PAD * 2 });
    }
    const qtyCol = cols.find((c) => c.key === "qty")!;
    const qtyText = `${Number(it.quantity).toLocaleString("en-IN")}${it.unit ? " " + it.unit : ""}`;
    doc.font("R").fontSize(8);
    rowH = Math.max(rowH, doc.heightOfString(qtyText, { width: qtyCol.w - PAD * 2 }), 12) + 10;

    if (y + rowH > PAGE.bottom - 10) {
      doc.addPage();
      y = 40;
      drawTableHeader();
    }

    const values: Record<string, string> = {
      hsn: it.hsnSac || "",
      gst: `${it.taxPercent}%`,
      qty: qtyText,
      rate: inr(it.unitPrice),
      amount: inr(it.amount),
      cgst: inr(it.cgst),
      sgst: inr(it.sgst),
      igst: inr(it.igst),
      total: inr(it.total),
    };

    let x = PAGE.left;
    for (const c of cols) {
      if (c.key === "item") {
        doc.font("B").fontSize(8).fillColor(COLOR.text).text(itemText, x + PAD, y, { width: c.w - PAD * 2 });
        if (it.details) doc.font("R").fontSize(7.5).fillColor(COLOR.muted).text(it.details, { width: c.w - PAD * 2 });
      } else {
        doc.font("R").fontSize(8).fillColor(COLOR.body).text(values[c.key], x + PAD, y, { width: c.w - PAD * 2, align: c.align });
      }
      x += c.w;
    }
    y += rowH;
    doc.strokeColor(COLOR.line).lineWidth(0.5).moveTo(PAGE.left, y - 5).lineTo(PAGE.right, y - 5).stroke();
  });

  // ---------- Totals (right) + bank / UPI (left) ----------
  const summary: { label: string; value: string; color?: string }[] = [{ label: "Amount", value: inr(totals.subTotal) }];
  if (totals.discountAmount > 0) {
    summary.push({ label: "Discount", value: `- ${inr(totals.discountAmount)}`, color: COLOR.overdue });
    summary.push({ label: "Taxable Amount", value: inr(totals.taxableAmount) });
  }
  if (isIgst) summary.push({ label: "IGST", value: inr(totals.igstAmount) });
  else {
    summary.push({ label: "CGST", value: inr(totals.cgstAmount) });
    summary.push({ label: "SGST", value: inr(totals.sgstAmount) });
  }
  if (totals.additionalCharges > 0) {
    summary.push({ label: record.additionalChargesLabel || "Additional Charges", value: inr(totals.additionalCharges) });
  }

  const hasBank = !!bank;
  const leftBlockH = (hasBank ? 20 + 13 * 5 : 0) + (upiQr ? 110 : 0);
  const rightBlockH = summary.length * 15 + 40 + (isInvoice ? 34 : 0) + 30;
  if (y + Math.max(leftBlockH, rightBlockH) > PAGE.bottom - 10) {
    doc.addPage();
    y = 40;
  }
  const blockTop = y + 4;

  const tx = PAGE.left + 300;
  const tw = PAGE.width - 300;
  let ty = blockTop;
  doc.fontSize(9);
  for (const row of summary) {
    doc.font("R").fillColor(row.color || COLOR.muted).text(row.label, tx, ty, { width: tw / 2 });
    doc.font("R").fillColor(row.color || COLOR.text).text(row.value, tx + tw / 2, ty, { width: tw / 2 - 6, align: "right" });
    ty += 15;
  }
  ty += 4;
  doc.roundedRect(tx - 6, ty - 4, tw + 6, 24, 4).lineWidth(1.2).strokeColor(COLOR.text).stroke();
  doc.font("B").fontSize(11).fillColor(COLOR.text).text("Total (INR)", tx, ty + 2, { width: tw / 2 });
  doc.text(inr(totals.totalAmount), tx + tw / 2, ty + 2, { width: tw / 2 - 6, align: "right" });
  ty += 28;
  if (isInvoice && amountPaid > 0) {
    doc.font("R").fontSize(9).fillColor(COLOR.paid).text("Amount Paid", tx, ty, { width: tw / 2 });
    doc.text(inr(amountPaid), tx + tw / 2, ty, { width: tw / 2 - 6, align: "right" });
    ty += 15;
  }
  if (isInvoice) {
    doc.font("B").fontSize(9.5).fillColor(balanceDue > 0 ? COLOR.due : COLOR.paid).text("Balance Due", tx, ty, { width: tw / 2 });
    doc.text(inr(balanceDue), tx + tw / 2, ty, { width: tw / 2 - 6, align: "right" });
    ty += 18;
  }
  doc.font("R").fontSize(7.5).fillColor(COLOR.muted).text("Total (in words)", tx, ty, { width: tw });
  doc.font("B").fontSize(8).fillColor(COLOR.text).text(totals.amountInWords, tx, doc.y + 1, { width: tw });
  ty = doc.y;

  let ly = blockTop;
  const lw = 280;
  if (bank) {
    const bankRows: [string, string | null | undefined][] = [
      ["Account Name", bank.accountName || company.name],
      ["Account Number", bank.accountNumber],
      ["IFSC", bank.ifsc],
      ["Bank", [bank.bankName, bank.branch].filter(Boolean).join(", ")],
      ["SWIFT", bank.swift],
    ];
    const rows = bankRows.filter(([, v]) => v);
    const bh = 22 + rows.length * 13;
    doc.roundedRect(PAGE.left, ly, lw, bh, 6).fill(COLOR.softBg);
    doc.font("B").fontSize(9.5).fillColor(COLOR.brand).text("Bank Details", PAGE.left + 10, ly + 8);
    let ry = ly + 24;
    for (const [label, value] of rows) {
      doc.font("R").fontSize(8).fillColor(COLOR.muted).text(label, PAGE.left + 10, ry, { width: 80 });
      doc.font("B").fillColor(COLOR.text).text(String(value), PAGE.left + 92, ry, { width: lw - 100 });
      ry += 13;
    }
    ly += bh + 8;
  }
  if (upiQr) {
    doc.roundedRect(PAGE.left, ly, lw, 100, 6).fill(COLOR.softBg);
    doc.image(upiQr, PAGE.left + 10, ly + 10, { width: 80, height: 80 });
    doc.font("B").fontSize(9.5).fillColor(COLOR.brand).text("Pay using UPI", PAGE.left + 100, ly + 14, { width: lw - 110 });
    doc.font("R").fontSize(8).fillColor(COLOR.body).text(`UPI ID: ${company.upiId}`, PAGE.left + 100, ly + 30, { width: lw - 110 });
    doc.text(`Amount: ${inr(balanceDue)}`, { width: lw - 110 });
    doc.fillColor(COLOR.muted).text("Scan with Google Pay, PhonePe, Paytm or any UPI app.", { width: lw - 110 });
    ly += 108;
  }

  y = Math.max(ly, ty) + 12;

  // ---------- Terms, notes, signature ----------
  const terms = record.termsAndConditions || (isInvoice ? company.invoiceTerms : company.quotationTerms);
  const sections: [string, string][] = [];
  if (terms) sections.push(["Terms and Conditions", terms]);
  if (record.notes) sections.push([isInvoice ? "Notes" : "Notes / Scope Details", record.notes]);

  for (const [title, body] of sections) {
    doc.font("R").fontSize(8.5);
    const h = 18 + doc.heightOfString(body, { width: PAGE.width, lineGap: 3 });
    if (y + Math.min(h, 120) > PAGE.bottom - 10) {
      doc.addPage();
      y = 40;
    }
    doc.font("B").fontSize(10.5).fillColor(COLOR.brand).text(title, PAGE.left, y);
    doc.font("R").fontSize(8.5).fillColor(COLOR.body).text(body, PAGE.left, doc.y + 4, { width: PAGE.width, lineGap: 3 });
    y = doc.y + 12;
  }

  const signature = dataUrlToBuffer(company.signatureDataUrl);
  const stamp = dataUrlToBuffer(company.stampDataUrl);
  if (signature || stamp) {
    if (y + 90 > PAGE.bottom - 10) {
      doc.addPage();
      y = 40;
    }
    const sx = PAGE.right - 170;
    try {
      if (stamp) doc.image(stamp, sx - 80, y, { fit: [70, 70] });
      if (signature) doc.image(signature, sx, y + 10, { fit: [160, 50], align: "center" });
    } catch {
      /* unreadable image: skip */
    }
    doc.font("B").fontSize(8.5).fillColor(COLOR.text).text(`For ${company.name}`, sx, y + 64, { width: 170, align: "center" });
    doc.font("R").fontSize(8).fillColor(COLOR.muted).text("Authorised Signatory", sx, doc.y + 1, { width: 170, align: "center" });
  }

  // ---------- PAID stamp + footer on every page ----------
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0; // the footer sits below the content margin
    if (i === range.start && isInvoice && record.paymentStatus === "PAID") {
      doc.save();
      doc.rotate(-12, { origin: [340, 100] });
      doc.roundedRect(290, 84, 100, 32, 6).lineWidth(2).strokeColor(COLOR.paid).stroke();
      doc.font("B").fontSize(18).fillColor(COLOR.paid).text("PAID", 290, 90, { width: 100, align: "center" });
      doc.restore();
    }
    doc.strokeColor("#cbd5e1").lineWidth(0.5).dash(2, { space: 2 }).moveTo(PAGE.left, 786).lineTo(PAGE.right, 786).stroke().undash();
    doc.font("R").fontSize(7.5).fillColor(COLOR.muted);
    doc.text(`${isInvoice ? "Invoice" : "Quotation"} ${number} · ${record.clientCompany || record.clientName || ""}`, PAGE.left, 792, {
      width: 360,
      lineBreak: false,
    });
    doc.text(`Page ${i - range.start + 1} of ${range.count}`, PAGE.right - 120, 792, { width: 120, align: "right", lineBreak: false });
    doc.fontSize(7).fillColor("#94a3b8").text("This is a computer-generated document.", PAGE.left, 804, { width: 300, lineBreak: false });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function documentFileName(kind: BillingDocKind, record: any): string {
  const number = kind === "invoice" ? record.invoiceNumber : record.quotationNumber;
  return `${kind === "invoice" ? "Invoice" : "Quotation"}_${String(number).replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;
}
