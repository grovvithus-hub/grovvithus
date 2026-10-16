import { prisma } from "@/lib/db";
import { CONTENT_ROLES } from "@/lib/auth";
import { jsonBody, ok, route } from "@/lib/http";
import { projectSchema, uniqueSlug } from "@/lib/projects";
import { mediaUrl } from "@/lib/media";
import { refreshPublicPortfolio } from "@/lib/revalidate";

export const GET = route({ roles: CONTENT_ROLES }, async (req) => {
  const url = new URL(req.url);
  const trash = url.searchParams.get("trash") === "1";
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search")?.trim();
  const rows = await prisma.project.findMany({
    where: {
      deletedAt: trash ? { not: null } : null,
      ...(status && status !== "ALL" ? { status } : {}),
      ...(search ? { OR: [{ title: { contains: search } }, { clientName: { contains: search } }, { industry: { contains: search } }] } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    take: 300,
    include: { cover: { select: { id: true } }, _count: { select: { media: true } } },
  });
  return ok(rows.map((r) => ({ ...r, coverThumb: r.cover ? mediaUrl(r.cover.id, true) : null, mediaCount: r._count.media })));
});

export const POST = route({ roles: CONTENT_ROLES }, async (req) => {
  const body = projectSchema.parse(await jsonBody(req));
  const { media, ...data } = body;
  const project = await prisma.project.create({
    data: {
      ...data,
      slug: await uniqueSlug(body.slug || body.title),
      serviceSlugs: data.serviceSlugs as never,
      technologies: data.technologies as never,
      results: data.results as never,
      publishedAt: body.status === "PUBLISHED" ? (body.publishedAt ?? new Date()) : body.publishedAt,
      media: { create: media.map((m, i) => ({ mediaId: m.mediaId, caption: m.caption, sortOrder: i })) },
    },
  });
  refreshPublicPortfolio();
  return ok(project, 201);
});
