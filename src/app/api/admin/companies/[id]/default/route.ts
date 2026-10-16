import { prisma } from "@/lib/db";
import { ADMIN_ONLY } from "@/lib/auth";
import { AppError, assertId, ok, route } from "@/lib/http";
import { setDefaultCompany } from "@/lib/billing/company";

export const POST = route<{ id: string }>({ roles: ADMIN_ONLY }, async (_req, { params }) => {
  assertId(params.id, "Company");
  if (!(await prisma.billingCompany.findUnique({ where: { id: params.id } }))) throw new AppError("Company not found", 404);
  return ok(await setDefaultCompany(params.id));
});
