import type { MetadataRoute } from "next";
import { SERVICES } from "@/content/services";
import { LEGAL, hasPlaceholders } from "@/content/legal";
import { SITE } from "@/content/site";
import { listPublicProjects } from "@/lib/projects";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const projects = await listPublicProjects({ limit: 500 });
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly", lastModified: Date = now) => ({ url: `${SITE.url}${path}`, lastModified, changeFrequency, priority });
  return [
    page("", 1, "weekly"),
    page("/services", 0.9),
    ...SERVICES.map((s) => page(`/services/${s.slug}`, 0.8)),
    page("/portfolio", 0.8, "weekly"),
    ...projects.map((p) => page(`/portfolio/${p.slug}`, 0.7, "monthly", p.updatedAt)),
    page("/pricing-models", 0.7),
    page("/about", 0.6),
    page("/contact", 0.7),
    // Unfinished legal drafts stay out of the sitemap (and are noindex).
    ...LEGAL.filter((d) => !hasPlaceholders(d.body)).map((d) => page(`/${d.slug}`, 0.3, "yearly")),
  ];
}
