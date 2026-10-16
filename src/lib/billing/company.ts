import crypto from "node:crypto";
import type { BillingCompany, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

export type CompanyProfile = Omit<BillingCompany, "id" | "createdAt" | "updatedAt"> & { id: string | null };

// Printed on documents until Billing Settings are saved. Replace in Billing Settings.
export const FALLBACK_COMPANY: CompanyProfile = {
  id: null,
  name: "GrovvIthUs",
  gstin: null,
  pan: null,
  email: null,
  phone: null,
  website: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  stateCode: null,
  pincode: null,
  country: "India",
  logoDataUrl: null,
  signatureDataUrl: null,
  stampDataUrl: null,
  bankAccountName: null,
  bankName: null,
  bankAccountNumber: null,
  bankIfsc: null,
  bankBranch: null,
  bankSwift: null,
  upiId: null,
  quotationTerms: null,
  invoiceTerms: null,
  defaultNotes: null,
  bankAccounts: null,
  emailCc: null,
  isDefault: true,
  isActive: true,
};

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

/** Value of a document's bankAccountId that hides bank details on it. */
export const NO_BANK = "NONE";

/** A company's bank accounts. Companies with only the flat bank fields expose that single account. */
export const listBankAccounts = (company: CompanyProfile): BankAccount[] => {
  const stored = Array.isArray(company.bankAccounts) ? (company.bankAccounts as unknown as BankAccount[]) : [];
  if (stored.length) return stored;
  if (!company.bankAccountNumber && !company.bankName) return [];
  return [
    {
      id: "primary",
      label: null,
      accountName: company.bankAccountName,
      bankName: company.bankName,
      accountNumber: company.bankAccountNumber,
      ifsc: company.bankIfsc,
      branch: company.bankBranch,
      swift: company.bankSwift,
      isDefault: true,
    },
  ];
};

/** Bank account to print on a document: the chosen one, else the company default; null hides bank details. */
export const resolveBankAccount = (company: CompanyProfile, bankAccountId?: string | null): BankAccount | null => {
  if (bankAccountId === NO_BANK) return null;
  const accounts = listBankAccounts(company);
  return accounts.find((a) => a.id === bankAccountId) || accounts.find((a) => a.isDefault) || accounts[0] || null;
};

/**
 * Give every account an id, make exactly one the default, and return the flat bank fields
 * mirroring that default (so anything reading the flat fields stays correct).
 */
export const normalizeBankAccounts = (
  input: (Omit<Partial<BankAccount>, "id"> & { id?: string | null })[] | undefined | null,
) => {
  const accounts: BankAccount[] = (input || [])
    .filter((a) => a && (a.accountNumber || a.bankName))
    .map((a) => ({
      id: a.id || crypto.randomUUID(),
      label: a.label || null,
      accountName: a.accountName || null,
      bankName: a.bankName || null,
      accountNumber: a.accountNumber || null,
      ifsc: a.ifsc || null,
      branch: a.branch || null,
      swift: a.swift || null,
      isDefault: !!a.isDefault,
    }));
  const defaultIdx = Math.max(0, accounts.findIndex((a) => a.isDefault));
  accounts.forEach((a, i) => (a.isDefault = i === defaultIdx));
  const d = accounts[defaultIdx];
  return {
    bankAccounts: accounts as unknown as Prisma.InputJsonValue,
    bankAccountName: d?.accountName ?? null,
    bankName: d?.bankName ?? null,
    bankAccountNumber: d?.accountNumber ?? null,
    bankIfsc: d?.ifsc ?? null,
    bankBranch: d?.branch ?? null,
    bankSwift: d?.swift ?? null,
  };
};

export async function getDefaultCompany() {
  return (
    (await prisma.billingCompany.findFirst({ where: { isDefault: true, isActive: true } })) ||
    (await prisma.billingCompany.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } }))
  );
}

/** Company printed on a document: its own, else the default, else the built-in fallback. */
export async function getCompanyForDocument(companyId?: string | null): Promise<CompanyProfile> {
  const company =
    (companyId ? await prisma.billingCompany.findUnique({ where: { id: companyId } }).catch(() => null) : null) ||
    (await getDefaultCompany());
  return company || FALLBACK_COMPANY;
}

/**
 * Company to stamp on a new/updated document: the requested one if valid, otherwise the default.
 * Returns null when no company exists yet, so documents work before Billing Settings are filled in.
 */
export async function resolveCompanyId(requestedId?: string | null, currentCompanyId?: string | null): Promise<string | null> {
  if (requestedId) {
    const company = await prisma.billingCompany.findUnique({ where: { id: requestedId } }).catch(() => null);
    // A deactivated company may stay on documents it already issued, but cannot be picked for new ones.
    if (!company || (!company.isActive && company.id !== currentCompanyId)) {
      throw new AppError("Selected company was not found or is inactive", 400);
    }
    return company.id;
  }
  const fallback = await getDefaultCompany();
  return fallback ? fallback.id : null;
}

export async function setDefaultCompany(id: string) {
  await prisma.billingCompany.updateMany({ where: { isDefault: true, NOT: { id } }, data: { isDefault: false } });
  return prisma.billingCompany.update({ where: { id }, data: { isDefault: true, isActive: true } });
}
