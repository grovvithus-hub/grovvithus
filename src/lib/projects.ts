import { z } from "zod";
import { prisma } from "@/lib/db";
import { SERVICES } from "@/content/services";
import { PORTFOLIO_CATEGORIES } from "@/content/site";
import { mediaUrl } from "@/lib/media";

// ---------- helpers ----------
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export async function uniqueSlug(base: string, ignoreId?: string) {
  const root = slugify(base) || "project";
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? root : `${root}-${i + 1}`;
    const hit = await prisma.project.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === ignoreId) return slug;
  }
  return `${root}-${Date.now()}`;
}

/** Turns a YouTube or Vimeo link into an embeddable URL; returns null for anything else. */
export function videoEmbed(url?: string | null): { kind: "iframe" | "file"; src: string } | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return /^[\w-]{6,20}$/.test(id) ? { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }
  if (host.endsWith("youtube.com")) {
    const id = u.searchParams.get("v") || (u.pathname.startsWith("/embed/") || u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : "");
    return id && /^[\w-]{6,20}$/.test(id) ? { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }
  if (host.endsWith("vimeo.com")) {
    const id = u.pathname.split("/").filter(Boolean).pop() || "";
    return /^\d{5,12}$/.test(id) ? { kind: "iframe", src: `https://player.vimeo.com/video/${id}` } : null;
  }
  if (u.pathname.toLowerCase().endsWith(".mp4")) return { kind: "file", src: u.toString() };
  return null;
}

const httpUrl = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .refine((v) => !v || /^https?:\/\/[^\s]+$/i.test(v), "Enter a full link starting with https://")
  .transform((v) => v || null);

const videoUrl = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .refine((v) => !v || videoEmbed(v) !== null, "Use a YouTube or Vimeo link, or an https link to an .mp4 file")
  .transform((v) => v || null);

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

const stringList = (max: number) =>
  z
    .array(z.string().trim().min(1).max(60))
    .max(max)
    .nullish()
    .transform((v) => [...new Set(v ?? [])]);

export const CATEGORY_KEYS = PORTFOLIO_CATEGORIES.map((c) => c.key) as [string, ...string[]];
const KNOWN_SERVICES = new Set(SERVICES.map((s) => s.slug));

export const projectSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(140),
  slug: z
    .string()
    .trim()
    .max(80)
    .nullish()
    .refine((v) => !v || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), "Use lowercase letters, numbers and dashes only")
    .transform((v) => v || null),
  clientName: text(160),
  showClientName: z.boolean().optional().default(false),
  category: z.enum(CATEGORY_KEYS).default("WEB"),
  industry: text(80),
  serviceSlugs: stringList(12).transform((l) => l.filter((s) => KNOWN_SERVICES.has(s))),
  technologies: stringList(20),
  year: z.coerce.number().int().min(2000).max(2100).nullish().transform((v) => v ?? null),
  summary: z.string().trim().min(10, "Write a short summary (at least 10 characters)").max(400),
  challenge: text(4000),
  solution: text(4000),
  results: z
    .array(z.object({ label: z.string().trim().min(1).max(80), value: z.string().trim().min(1).max(40) }))
    .max(6)
    .nullish()
    .transform((v) => v ?? []),
  liveUrl: httpUrl,
  videoUrl,
  testimonialQuote: text(1200),
  testimonialAuthor: text(120),
  testimonialRole: text(120),
  coverMediaId: z.string().nullish().transform((v) => v || null),
  media: z
    .array(z.object({ mediaId: z.string().min(10).max(40), caption: text(200) }))
    .max(24)
    .nullish()
    .transform((v) => v ?? []),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  featured: z.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional().default(0),
  publishedAt: z.preprocess((v) => (v === undefined || v === null || v === "" ? null : new Date(String(v))), z.date({ error: "Invalid date" }).nullable()),
  seoTitle: text(70),
  seoDescription: text(170),
});

export type ProjectInput = z.infer<typeof projectSchema>;

// ---------- public queries ----------
const visibleWhere = () => ({
  deletedAt: null,
  status: "PUBLISHED",
  OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
});

const include = {
  cover: true,
  media: { orderBy: { sortOrder: "asc" as const }, include: { media: true } },
};

export type PublicProject = NonNullable<Awaited<ReturnType<typeof getPublicProject>>>;

export async function listPublicProjects(opts: { category?: string; limit?: number; featuredOnly?: boolean } = {}) {
  const rows = await prisma.project.findMany({
    where: { ...visibleWhere(), ...(opts.category ? { category: opts.category } : {}), ...(opts.featuredOnly ? { featured: true } : {}) },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: opts.limit ?? 60,
    include: { cover: true },
  });
  return rows.map(shape);
}

export async function getPublicProject(slug: string, allowDraft = false) {
  const row = await prisma.project.findFirst({
    where: allowDraft ? { slug, deletedAt: null } : { slug, ...visibleWhere() },
    include,
  });
  if (!row) return null;
  return { ...shape(row), media: row.media.map((m) => ({ id: m.mediaId, url: mediaUrl(m.mediaId), thumb: mediaUrl(m.mediaId, true), width: m.media.width, height: m.media.height, alt: m.caption || m.media.altText || row.title, caption: m.caption })) };
}

const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function shape(row: Awaited<ReturnType<typeof prisma.project.findFirst>> & { cover?: { id: string; width: number; height: number; altText: string | null } | null }) {
  const r = row!;
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    clientName: r.showClientName ? r.clientName : null,
    category: r.category,
    industry: r.industry,
    serviceSlugs: strArray(r.serviceSlugs),
    technologies: strArray(r.technologies),
    year: r.year,
    summary: r.summary,
    challenge: r.challenge,
    solution: r.solution,
    results: (Array.isArray(r.results) ? (r.results as { label: string; value: string }[]) : []).filter((x) => x && x.label && x.value),
    liveUrl: r.liveUrl,
    videoUrl: r.videoUrl,
    testimonial: r.testimonialQuote ? { quote: r.testimonialQuote, author: r.testimonialAuthor, role: r.testimonialRole } : null,
    cover: r.cover ? { url: mediaUrl(r.cover.id), thumb: mediaUrl(r.cover.id, true), width: r.cover.width, height: r.cover.height, alt: r.cover.altText || r.title } : null,
    featured: r.featured,
    publishedAt: r.publishedAt,
    updatedAt: r.updatedAt,
    seoTitle: r.seoTitle,
    seoDescription: r.seoDescription,
  };
}
