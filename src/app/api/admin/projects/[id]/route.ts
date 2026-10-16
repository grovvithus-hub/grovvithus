import { prisma } from "@/lib/db";
import { CONTENT_ROLES } from "@/lib/auth";
import { AppError, assertId, jsonBody, message, ok, route } from "@/lib/http";
import { projectSchema, uniqueSlug } from "@/lib/projects";
import { mediaUrl } from "@/lib/media";
import { refreshPublicPortfolio } from "@/lib/revalidate";

const withMedia = {
  cover: true,
  media: { orderBy: { sortOrder: "asc" as const }, include: { media: true } },
};

export const GET = route<{ id: string }>({ roles: CONTENT_ROLES }, async (_req, { params }) => {
  assertId(params.id, "Project");
  const p = await prisma.project.findUnique({ where: { id: params.id }, include: withMedia });
  if (!p) throw new AppError("Project not found", 404);
  return ok({
    ...p,
    media: p.media.map((m) => ({ id: m.mediaId, caption: m.caption, url: mediaUrl(m.mediaId), thumbUrl: mediaUrl(m.mediaId, true), width: m.media.width, height: m.media.height })),
  });
});

export const PUT = route<{ id: string }>({ roles: CONTENT_ROLES }, async (req, { params }) => {
  assertId(params.id, "Project");
  const existing = await prisma.project.findUnique({ where: { id: params.id } });
  if (!existing) throw new AppError("Project not found", 404);
  const body = projectSchema.parse(await jsonBody(req));
  const { media, ...data } = body;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.projectMedia.deleteMany({ where: { projectId: existing.id } });
    return tx.project.update({
      where: { id: existing.id },
      data: {
        ...data,
        slug: await uniqueSlug(body.slug || existing.slug, existing.id),
        serviceSlugs: data.serviceSlugs as never,
        technologies: data.technologies as never,
        results: data.results as never,
        // A blank date publishes now, unless it was already live (keep its original date) - a leftover future date must not keep it hidden.
        publishedAt:
          body.status === "PUBLISHED"
            ? (body.publishedAt ?? (existing.publishedAt && existing.publishedAt <= new Date() ? existing.publishedAt : new Date()))
            : body.publishedAt,
        media: { create: media.map((m, i) => ({ mediaId: m.mediaId, caption: m.caption, sortOrder: i })) },
      },
    });
  });
  refreshPublicPortfolio();
  return ok(updated);
});

/** Soft delete: moves the project to the trash. `?restore=1` brings it back. */
export const DELETE = route<{ id: string }>({ roles: CONTENT_ROLES }, async (req, { params }) => {
  assertId(params.id, "Project");
  const existing = await prisma.project.findUnique({ where: { id: params.id } });
  if (!existing) throw new AppError("Project not found", 404);
  const restore = new URL(req.url).searchParams.get("restore") === "1";
  await prisma.project.update({ where: { id: existing.id }, data: { deletedAt: restore ? null : new Date(), ...(restore ? {} : { status: "DRAFT" }) } });
  refreshPublicPortfolio();
  return message(restore ? "Project restored" : "Project moved to the trash");
});
