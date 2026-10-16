import type { BillingLine } from "@/lib/billing/calc";

export interface LineItem {
  description: string;
  details?: string | null;
  hsnSac?: string | null;
  quantity?: number;
  unit?: string | null;
  unitPrice?: number;
  taxPercent?: number | null;
  amount?: number;
}

export interface BankAccount {
  id: string;
  label: string | null;
  accountName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  branch: string | null;
  swift: string | null;
  isDefault: boolean;
}

export interface BillingCompany {
  id: string;
  name: string;
  gstin: string | null;
  pan: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  stateCode: string | null;
  pincode: string | null;
  country: string;
  logoDataUrl: string | null;
  signatureDataUrl: string | null;
  stampDataUrl: string | null;
  bankAccountName: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankBranch: string | null;
  bankSwift: string | null;
  upiId: string | null;
  bankAccounts: BankAccount[] | null;
  quotationTerms: string | null;
  invoiceTerms: string | null;
  defaultNotes: string | null;
  emailCc: string | null;
  isDefault: boolean;
  isActive: boolean;
  _count?: { quotations: number; invoices: number };
}

export interface BillingClient {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  billingAddress: string | null;
  state: string | null;
  stateCode: string | null;
}

export interface Lead {
  id: string;
  leadNumber: string;
  clientName: string;
  companyName: string | null;
  email: string;
  phone: string;
  serviceOfInterest: string | null;
  projectDetails: string | null;
  timeline: string | null;
  source: string;
  status: string;
  estimatedValue: number;
  notes: string | null;
  createdAt: string;
  quotations?: { id: string; quotationNumber: string; status: string }[];
}

interface DocumentBase {
  id: string;
  companyId: string | null;
  clientId: string | null;
  poNumber: string | null;
  bankAccountId: string | null;
  clientName: string;
  clientCompany: string | null;
  clientEmail: string;
  clientPhone: string | null;
  clientGst: string | null;
  placeOfSupplyCode: string | null;
  items: (BillingLine | LineItem)[];
  taxPercent: number;
  taxType: string | null;
  taxAmount: number;
  subTotal: number;
  discountAmount: number;
  additionalCharges: number;
  additionalChargesLabel: string | null;
  totalAmount: number;
  termsAndConditions: string | null;
  notes: string | null;
  sentViaEmail: boolean;
  sentViaWhatsApp: boolean;
  viewedAt: string | null;
  viewCount: number;
  createdAt: string;
}

export interface Quotation extends DocumentBase {
  quotationNumber: string;
  leadId: string | null;
  title: string | null;
  clientAddress: string | null;
  status: string;
  validUntil: string | null;
  acceptedAt: string | null;
  acceptedBy: string | null;
  invoices?: { id: string; invoiceNumber: string; paymentStatus: string; totalAmount: number }[];
}

export interface Invoice extends DocumentBase {
  invoiceNumber: string;
  quotationId: string | null;
  billingAddress: string | null;
  issueDate: string;
  dueDate: string;
  isDraft: boolean;
  paymentStatus: string;
  amountPaid: number;
  balanceDue: number;
  quotation?: { id: string; quotationNumber: string } | null;
}

export interface PaymentEntry {
  amount: number;
  method: string;
  reference: string | null;
  date: string;
  notes: string | null;
  recordedAt: string;
  recordedBy?: string | null;
}
