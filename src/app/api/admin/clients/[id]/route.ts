import { prisma } from "@/lib/db";
import { BILLING_ROLES } from "@/lib/auth";
import { AppError, assertId, jsonBody, message, ok, route } from "@/lib/http";
import { billingClientSchema } from "@/lib/billing/validators";

export const PUT = route<{ id: string }>({ roles: BILLING_ROLES }, async (req, { params }) => {
  assertId(params.id, "Client");
  if (!(await prisma.billingClient.findUnique({ where: { id: params.id } }))) throw new AppError("Client not found", 404);
  const data = billingClientSchema.parse(await jsonBody(req));
  return ok(await prisma.billingClient.update({ where: { id: params.id }, data }));
});

export const DELETE = route<{ id: string }>({ roles: BILLING_ROLES }, async (_req, { params }) => {
  assertId(params.id, "Client");
  if (!(await prisma.billingClient.findUnique({ where: { id: params.id } }))) throw new AppError("Client not found", 404);
  // Documents keep their own copy of the client details, so only the link is removed.
  await prisma.billingClient.delete({ where: { id: params.id } });
  return message("Client deleted");
});
