import { z } from "zod";

// ---------- helpers ----------
const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const money = z.coerce.number().min(0, "Must be 0 or more");

const optionalId = z
  .string()
  .nullish()
  .transform((v) => (v && /^[a-z0-9]{20,32}$/i.test(v) ? v : null));

const optionalDate = z.preprocess(
  (v) => (v === undefined || v === null || v === "" ? null : v instanceof Date ? v : new Date(String(v))),
  z.date({ error: "Invalid date" }).nullable(),
);

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const strictGstin = z
  .string()
  .trim()
  .toUpperCase()
  .nullish()
  .refine((v) => !v || GSTIN_RE.test(v), "Invalid GSTIN format")
  .transform((v) => (v ? v : null));

const stateCode = z
  .string()
  .trim()
  .nullish()
  .refine((v) => !v || /^[0-9]{2}$/.test(v), "State code must be 2 digits")
  .transform((v) => (v ? v : null));

const email = z.string().trim().email("Enter a valid email");

const optionalEmail = z
  .union([email, z.literal("")])
  .nullish()
  .transform((v) => (v ? v : null));

const emailListString = z
  .union([z.array(z.string()), z.string()])
  .nullish()
  .transform((v) => (Array.isArray(v) ? v : (v || "").split(",")).map((e) => e.trim()).filter(Boolean))
  .refine((list) => list.every((e) => z.string().email().safeParse(e).success), "Enter valid CC email addresses")
  .refine((list) => list.length <= 10, "At most 10 CC addresses");

// PNG or JPEG only (that is what the PDF engine can embed), about 700 KB at most.
const imageDataUrl = z
  .string()
  .nullish()
  .refine((v) => !v || /^data:image\/(png|jpe?g);base64,[A-Za-z0-9+/=]+$/.test(v), "Use a PNG or JPEG image")
  .refine((v) => !v || v.length <= 950_000, "Image is too large (max about 700 KB)")
  .transform((v) => (v ? v : null));

// ---------- companies and clients ----------
export const bankAccountSchema = z.object({
  id: z.string().max(64).nullish(),
  label: optionalText(60),
  accountName: optionalText(200),
  bankName: optionalText(200),
  accountNumber: z
    .string()
    .trim()
    .nullish()
    .refine((v) => !v || /^[0-9A-Za-z]{6,34}$/.test(v), "Account number should be 6 to 34 letters/digits without spaces")
    .transform((v) => (v ? v : null)),
  ifsc: z
    .string()
    .trim()
    .toUpperCase()
    .nullish()
    .refine((v) => !v || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v), "Invalid IFSC code")
    .transform((v) => (v ? v : null)),
  branch: optionalText(200),
  swift: optionalText(20),
  isDefault: z.boolean().optional().default(false),
});

export const billingCompanySchema = z.object({
  name: z.string().trim().min(2, "Company name is required").max(200),
  gstin: strictGstin,
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .nullish()
    .refine((v) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v), "Invalid PAN format")
    .transform((v) => (v ? v : null)),
  email: optionalEmail,
  phone: optionalText(30),
  website: optionalText(200),
  addressLine1: optionalText(),
  addressLine2: optionalText(),
  city: optionalText(100),
  state: optionalText(100),
  stateCode,
  pincode: optionalText(10),
  country: z.string().trim().max(100).optional().default("India"),
  logoDataUrl: imageDataUrl,
  signatureDataUrl: imageDataUrl,
  stampDataUrl: imageDataUrl,
  bankAccountName: optionalText(200),
  bankName: optionalText(200),
  bankAccountNumber: optionalText(40),
  bankIfsc: z
    .string()
    .trim()
    .toUpperCase()
    .nullish()
    .refine((v) => !v || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v), "Invalid IFSC code")
    .transform((v) => (v ? v : null)),
  bankBranch: optionalText(200),
  bankSwift: optionalText(20),
  upiId: z
    .string()
    .trim()
    .nullish()
    .refine((v) => !v || /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(v), "Invalid UPI ID")
    .transform((v) => (v ? v : null)),
  bankAccounts: z
    .array(bankAccountSchema)
    .max(10, "At most 10 bank accounts")
    .nullish()
    .transform((v) => v ?? undefined),
  quotationTerms: optionalText(5000),
  invoiceTerms: optionalText(5000),
  defaultNotes: optionalText(5000),
  emailCc: emailListString.transform((list) => (list.length ? list.join(", ") : null)),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const billingClientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required").max(200),
  company: optionalText(200),
  email: optionalEmail,
  phone: optionalText(30),
  gstin: strictGstin,
  billingAddress: optionalText(1000),
  state: optionalText(100),
  stateCode,
  leadId: optionalId,
});

// ---------- quotation / invoice documents ----------
export const billingLineItemSchema = z.object({
  description: z.string().trim().min(1, "Item name is required").max(500),
  details: optionalText(2000).transform((v) => v ?? undefined),
  hsnSac: z
    .string()
    .trim()
    .max(20)
    .nullish()
    .transform((v) => v || undefined),
  quantity: z.coerce.number().min(0).default(1),
  unit: z
    .string()
    .trim()
    .max(20)
    .nullish()
    .transform((v) => v || undefined),
  unitPrice: money,
  taxPercent: z.coerce.number().min(0).max(100).nullish(),
});

const billingDocumentBase = {
  companyId: optionalId,
  clientId: optionalId,
  poNumber: optionalText(60),
  bankAccountId: z
    .string()
    .trim()
    .max(64)
    .nullish()
    .transform((v) => v || null),
  clientName: z.string().trim().min(1, "Client name is required").max(200),
  clientCompany: optionalText(200),
  clientEmail: email.max(200),
  clientPhone: optionalText(30),
  // Documents accept free-text GSTIN so older documents stay editable; companies and clients validate strictly.
  clientGst: z
    .string()
    .trim()
    .toUpperCase()
    .max(30)
    .nullish()
    .transform((v) => (v ? v : null)),
  items: z.array(billingLineItemSchema).min(1, "Add at least one item").max(200),
  taxPercent: z.coerce.number().min(0).max(100).optional().default(18),
  discountAmount: money.optional().default(0),
  additionalCharges: money.optional().default(0),
  additionalChargesLabel: optionalText(100),
  placeOfSupplyCode: z
    .string()
    .trim()
    .nullish()
    .refine((v) => !v || /^[0-9]{2}$/.test(v), "Invalid place of supply")
    .transform((v) => v || null),
  termsAndConditions: optionalText(10000),
  notes: optionalText(10000),
};

export const quotationDocumentSchema = z.object({
  ...billingDocumentBase,
  leadId: optionalId,
  title: optionalText(200),
  clientAddress: optionalText(1000),
  validUntil: optionalDate,
  status: z.enum(["DRAFT", "SENT", "VIEWED", "ACCEPTED", "DECLINED", "EXPIRED"]).optional(),
});

export const invoiceDocumentSchema = z.object({
  ...billingDocumentBase,
  quotationId: optionalId,
  billingAddress: optionalText(1000),
  issueDate: optionalDate,
  dueDate: optionalDate,
  isDraft: z.boolean().optional().default(false),
  // Only used on create: an advance already received
  amountPaid: money.optional().default(0),
  paymentMethod: optionalText(40),
  paymentReference: optionalText(100),
});

export const recordPaymentSchema = z.object({
  paymentAmount: z.coerce.number().gt(0, "Payment amount must be more than 0"),
  paymentMethod: z.string().trim().max(40).optional().default("BANK_TRANSFER"),
  paymentReference: optionalText(100),
  paymentDate: optionalDate,
  notes: optionalText(500),
});

export const sendEmailSchema = z.object({
  to: z.string().trim().email("Enter a valid recipient email").optional(),
  cc: emailListString.optional(),
  subject: z.string().trim().min(1).max(200).optional(),
  message: z.string().trim().min(1).max(5000).optional(),
  attachPdf: z.boolean().optional().default(true),
  includeLink: z.boolean().optional().default(true),
});

export const whatsappSchema = z.object({
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().max(4000).optional(),
});

export const acceptSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
});

// ---------- leads ----------
export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "DEMO_SCHEDULED",
  "DEMO_COMPLETED",
  "PROPOSAL_SENT",
  "NEGOTIATING",
  "WON",
  "LOST",
] as const;

export const leadSchema = z.object({
  clientName: z.string().trim().min(1, "Name is required").max(200),
  companyName: optionalText(200),
  email,
  phone: z.string().trim().min(5, "Phone is required").max(30),
  serviceOfInterest: optionalText(100),
  projectDetails: optionalText(5000),
  timeline: optionalText(100),
  source: z.string().trim().max(40).optional().default("WEBSITE"),
  status: z.enum(LEAD_STATUSES).optional(),
  estimatedValue: money.optional().default(0),
  notes: optionalText(5000),
  followUpDate: optionalDate,
});

export const publicInquirySchema = z.object({
  clientName: z.string().trim().min(1, "Please enter your name").max(200),
  companyName: optionalText(200),
  email,
  phone: z.string().trim().min(5, "Please enter a phone number").max(30),
  serviceOfInterest: optionalText(100),
  projectDetails: optionalText(2000),
  timeline: optionalText(100),
  /** "QUOTE" | "DEMO" | "CALL": which option the visitor picked on the site. */
  intent: z.enum(["QUOTE", "DEMO", "CALL"]).optional().default("QUOTE"),
  /** Honeypot: real visitors leave this empty. */
  website: z.string().max(200).optional(),
});
