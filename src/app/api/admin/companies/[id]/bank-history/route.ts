import { ADMIN_ONLY } from "@/lib/auth";
import { assertId, ok, route } from "@/lib/http";
import { getBankChangeHistory } from "@/lib/billing/audit";

export const GET = route<{ id: string }>({ roles: ADMIN_ONLY }, async (_req, { params }) => {
  assertId(params.id, "Company");
  return ok(await getBankChangeHistory(params.id));
});
