import { prisma } from "@/lib/db";
import { BILLING_ROLES } from "@/lib/auth";
import { jsonBody, ok, route } from "@/lib/http";
import { billingClientSchema } from "@/lib/billing/validators";

export const GET = route({ roles: BILLING_ROLES }, async (req) => {
  const search = new URL(req.url).searchParams.get("search")?.trim() || "";
  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { company: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { gstin: { contains: search } },
        ],
      }
    : {};
  return ok(await prisma.billingClient.findMany({ where, orderBy: { name: "asc" }, take: 200 }));
});

export const POST = route({ roles: BILLING_ROLES }, async (req) => {
  const data = billingClientSchema.parse(await jsonBody(req));
  return ok(await prisma.billingClient.create({ data }), 201);
});
