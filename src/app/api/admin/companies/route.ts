import { prisma } from "@/lib/db";
import { ADMIN_ONLY, BILLING_ROLES } from "@/lib/auth";
import { jsonBody, ok, route } from "@/lib/http";
import { diffBankDetails, recordBankChanges } from "@/lib/billing/audit";
import { getDefaultCompany, normalizeBankAccounts, setDefaultCompany } from "@/lib/billing/company";
import { billingCompanySchema } from "@/lib/billing/validators";

export const GET = route({ roles: BILLING_ROLES }, async () => {
  const companies = await prisma.billingCompany.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { quotations: true, invoices: true } } },
  });
  return ok(companies);
});

export const POST = route({ roles: ADMIN_ONLY }, async (req, { user }) => {
  const raw = await jsonBody(req);
  const { bankAccounts, isDefault, ...fields } = billingCompanySchema.parse(raw);
  const data = { ...fields, ...(bankAccounts ? normalizeBankAccounts(bankAccounts) : {}) };
  const existingDefault = await getDefaultCompany();

  let company = await prisma.billingCompany.create({ data: { ...data, isActive: true } });
  // The first company, or one explicitly marked default, becomes the default.
  if (!existingDefault || isDefault === true) company = await setDefaultCompany(company.id);
  await recordBankChanges(user!, req, company.id, company.name, diffBankDetails(null, company));
  return ok(company, 201);
});
