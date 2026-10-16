import { z } from "zod";
import { prisma } from "@/lib/db";
import { CONTENT_ROLES } from "@/lib/auth";
import { jsonBody, message, route } from "@/lib/http";
import { refreshPublicPortfolio } from "@/lib/revalidate";

const schema = z.object({ ids: z.array(z.string().min(10).max(40)).min(1).max(300) });

/** Saves a new display order: the first id gets sort order 0, and so on. */
export const POST = route({ roles: CONTENT_ROLES }, async (req) => {
  const { ids } = schema.parse(await jsonBody(req));
  await prisma.$transaction(ids.map((id, i) => prisma.project.update({ where: { id }, data: { sortOrder: i } })));
  refreshPublicPortfolio();
  return message("Order saved");
});
