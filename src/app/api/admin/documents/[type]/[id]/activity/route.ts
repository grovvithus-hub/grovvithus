import { prisma } from "@/lib/db";
import { BILLING_ROLES } from "@/lib/auth";
import { ok, route } from "@/lib/http";
import { kindFromParam, loadDocument } from "@/lib/billing/documents";

export const GET = route<{ type: string; id: string }>({ roles: BILLING_ROLES }, async (_req, { params }) => {
  const kind = kindFromParam(params.type);
  const { record } = await loadDocument(kind, params.id);
  const logs = await prisma.communicationLog.findMany({
    where: { referenceId: record.id },
    orderBy: { sentAt: "desc" },
    take: 50,
    select: { id: true, channel: true, recipient: true, subject: true, status: true, errorMessage: true, sentAt: true },
  });
  return ok({
    logs,
    viewedAt: record.viewedAt || null,
    viewCount: record.viewCount || 0,
    acceptedAt: record.acceptedAt || null,
    acceptedBy: record.acceptedBy || null,
    payments: kind === "invoice" ? record.payments || [] : [],
  });
});
