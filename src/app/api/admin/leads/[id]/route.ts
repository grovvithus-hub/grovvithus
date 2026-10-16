import { prisma } from "@/lib/db";
import { BILLING_ROLES } from "@/lib/auth";
import { AppError, assertId, jsonBody, message, ok, route } from "@/lib/http";
import { leadSchema } from "@/lib/billing/validators";

export const GET = route<{ id: string }>({ roles: BILLING_ROLES }, async (_req, { params }) => {
  assertId(params.id, "Lead");
  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) throw new AppError("Lead not found", 404);
  return ok(lead);
});

export const PUT =route<{ id: string }>({ roles: BILLING_ROLES }, async (req, { params }) => {
  assertId(params.id, "Lead");
  if (!(await prisma.lead.findUnique({ where: { id: params.id } }))) throw new AppError("Lead not found", 404);
  const body = leadSchema.parse(await jsonBody(req));
  return ok(await prisma.lead.update({ where: { id: params.id }, data: body }));
});

export const DELETE = route<{ id: string }>({ roles: BILLING_ROLES }, async (_req, { params }) => {
  assertId(params.id, "Lead");
  if (!(await prisma.lead.findUnique({ where: { id: params.id } }))) throw new AppError("Lead not found", 404);
  await prisma.lead.delete({ where: { id: params.id } });
  return message("Lead deleted");
});
