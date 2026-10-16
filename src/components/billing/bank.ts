import type { BankAccount, BillingCompany } from "./types";

export const NO_BANK = "NONE";

/** A company's bank accounts; a company with only the flat fields exposes that single account. */
export const companyBankAccounts = (company: BillingCompany | null | undefined): BankAccount[] => {
  if (!company) return [];
  if (Array.isArray(company.bankAccounts) && company.bankAccounts.length) return company.bankAccounts;
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

export const bankAccountLabel = (a: BankAccount) =>
  [a.label || a.bankName || "Bank account", a.accountNumber ? `••••${a.accountNumber.slice(-4)}` : ""].filter(Boolean).join(" ");
