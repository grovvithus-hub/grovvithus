import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Crumbs, JsonLd, ProjectCard } from "@/components/site/parts";
import { PORTFOLIO_CATEGORIES, SITE, categoryLabel } from "@/content/site";
import { listPublicProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Portfolio: websites, apps, logos, videos and marketing work",
  description: "Projects by GrovvIthUs: websites, apps and software, logos and brand identity, video, posters and marketing, with the challenge, the approach and the result.",
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const active = PORTFOLIO_CATEGORIES.find((c) => c.key === category)?.key;
  const [projects, all] = await Promise.all([listPublicProjects({ category: active, limit: 60 }), listPublicProjects({ limit: 200 })]);
  const available = new Set(all.map((p) => p.category));

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-8">
      <Crumbs items={[{ name: "Portfolio", href: "/portfolio" }]} />
      <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">Work that grew with its clients</h1>
      <p className="s-muted mt-5 max-w-2xl text-lg">Every project shows the problem, what we did and what changed. We only publish work we have permission to share.</p>

      <nav aria-label="Filter by category" className="mt-8 flex flex-wrap gap-2">
        <Link href="/portfolio" aria-current={!active ? "page" : undefined} className={`chip ${!active ? "chip-accent" : "hover:border-[var(--s-accent-text)]"}`}>All</Link>
        {PORTFOLIO_CATEGORIES.filter((c) => available.has(c.key) || c.key === active).map((c) => (
          <Link key={c.key} href={`/portfolio?category=${c.key}`} aria-current={active === c.key ? "page" : undefined} className={`chip ${active === c.key ? "chip-accent" : "hover:border-[var(--s-accent-text)]"}`}>
            {c.label}
          </Link>
        ))}
      </nav>

      {projects.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (<ProjectCard key={p.id} project={p} priority={i < 3} />))}
        </div>
      ) : (
        <div className="s-card mt-10 p-10 text-center sm:p-14">
          <h2 className="text-2xl font-bold">{active ? `No ${categoryLabel(active).toLowerCase()} projects yet` : "Our first case studies are on the way"}</h2>
          <p className="s-muted mx-auto mt-2 max-w-lg">We are adding projects as clients approve them. Tell us what you want to build and we will show you relevant examples in your first call.</p>
          <Link href="/contact" className="btn-lime mt-6">Get a quote <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
        </div>
      )}

      {projects.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${SITE.name} portfolio`,
            itemListElement: projects.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: `${SITE.url}/portfolio/${p.slug}` })),
          }}
        />
      )}
    </div>
  );
}
