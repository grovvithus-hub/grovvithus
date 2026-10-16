import { prisma } from "@/lib/db";
import { like } from "@/lib/dbsearch";
import { BILLING_ROLES } from "@/lib/auth";
import { jsonBody, ok, route } from "@/lib/http";
import { nextDocumentNumber } from "@/lib/billing/numbers";
import { leadSchema } from "@/lib/billing/validators";

export const GET = route({ roles: BILLING_ROLES }, async (req) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search")?.trim();
  const leads = await prisma.lead.findMany({
    where: {
      ...(status && status !== "ALL" ? { status } : {}),
      ...(search
        ? { OR: [{ clientName: like(search) }, { companyName: like(search) }, { email: like(search) }, { phone: like(search) }, { leadNumber: like(search) }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { quotations: { select: { id: true, quotationNumber: true, status: true } } },
  });
  return ok(leads);
});

export const POST = route({ roles: BILLING_ROLES }, async (req) => {
  const body = leadSchema.parse(await jsonBody(req));
  const lead = await prisma.lead.create({ data: { ...body, leadNumber: await nextDocumentNumber("LEAD"), status: body.status ?? "NEW" } });
  return ok(lead, 201);
});
