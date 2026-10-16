import { prisma } from "@/lib/db";
import { ADMIN_ONLY } from "@/lib/auth";
import { AppError, assertId, jsonBody, message, ok, route } from "@/lib/http";
import { diffBankDetails, recordBankChanges } from "@/lib/billing/audit";
import { normalizeBankAccounts } from "@/lib/billing/company";
import { billingCompanySchema } from "@/lib/billing/validators";

export const PUT = route<{ id: string }>({ roles: ADMIN_ONLY }, async (req, { params, user }) => {
  assertId(params.id, "Company");
  const existing = await prisma.billingCompany.findUnique({ where: { id: params.id } });
  if (!existing) throw new AppError("Company not found", 404);

  const { bankAccounts, isDefault: _ignored, ...fields } = billingCompanySchema.parse(await jsonBody(req));
  void _ignored;
  const data = { ...fields, ...(bankAccounts ? normalizeBankAccounts(bankAccounts) : {}) };
  if (existing.isDefault && data.isActive === false) {
    throw new AppError("The default company cannot be deactivated. Make another company default first.", 400);
  }

  const company = await prisma.billingCompany.update({ where: { id: params.id }, data });
  await recordBankChanges(user!, req, company.id, company.name, diffBankDetails(existing, company));
  return ok(company);
});

export const DELETE = route<{ id: string }>({ roles: ADMIN_ONLY }, async (req, { params, user }) => {
  assertId(params.id, "Company");
  const existing = await prisma.billingCompany.findUnique({
    where: { id: params.id },
    include: { _count: { select: { quotations: true, invoices: true } } },
  });
  if (!existing) throw new AppError("Company not found", 404);
  if (existing.isDefault) throw new AppError("The default company cannot be deleted. Make another company default first.", 400);

  // Keep companies that appear on documents so old PDFs still show the right details.
  if (existing._count.quotations + existing._count.invoices > 0) {
    const company = await prisma.billingCompany.update({ where: { id: params.id }, data: { isActive: false } });
    return message("Company is used on existing documents, so it was deactivated instead of deleted.", company);
  }

  await prisma.billingCompany.delete({ where: { id: params.id } });
  await recordBankChanges(user!, req, existing.id, existing.name, diffBankDetails(existing, null));
  return message("Company deleted");
});
