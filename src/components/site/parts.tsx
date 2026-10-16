/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Plus } from "lucide-react";
import { SITE, categoryLabel } from "@/content/site";
import type { PublicProject } from "@/lib/projects";
import { Reveal, TiltCard } from "./Motion";

export function JsonLd({ data }: { data: unknown }) {
  // Escape "<" so content can never close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function SectionHeading({ id, eyebrow, title, text, center = false }: { id?: string; eyebrow?: string; title: string; text?: string; center?: boolean }) {
  return (
    <div className={`mb-10 max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className="chip chip-accent mb-3">{eyebrow}</p>}
      <h2 id={id} className="text-3xl font-bold leading-[1.1] sm:text-4xl lg:text-5xl">{title}</h2>
      {text && <p className="s-muted mt-4 text-lg">{text}</p>}
    </div>
  );
}

export function Crumbs({ items }: { items: { name: string; href: string }[] }) {
  const all = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((c, i) => (
            <li key={c.href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />}
              {i === all.length - 1 ? (
                <span aria-current="page" className="font-semibold">{c.name}</span>
              ) : (
                <Link href={c.href} className="s-muted hover:text-[var(--s-accent-text)]">{c.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${SITE.url}${c.href === "/" ? "" : c.href}` })),
        }}
      />
    </>
  );
}

export function Faq({ items, title = "Frequently asked questions" }: { items: { q: string; a: string }[]; title?: string }) {
  return (
    <>
      <h2 className="mb-6 text-3xl font-bold sm:text-4xl">{title}</h2>
      <div className="space-y-3">
        {items.map((f) => (
          <details key={f.q} className="s-card group px-5 py-4 open:border-[var(--s-accent-text)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
              {f.q}
              <Plus className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-45" aria-hidden="true" />
            </summary>
            <p className="s-muted mt-3 max-w-3xl">{f.a}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
    </>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={hidden || undefined}>
      {items.map((t) => (
        <li key={t} className="font-display flex items-center gap-8 whitespace-nowrap text-xl font-bold sm:text-2xl">
          {t}
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--s-accent)" }} />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden border-y s-border py-5" aria-label="Services we offer">
      <div className="gv-marquee">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

export function ProjectCard({ project, priority = false }: { project: Pick<PublicProject, "slug" | "title" | "summary" | "category" | "cover" | "industry" | "year" | "clientName">; priority?: boolean }) {
  return (
    <Reveal>
      <TiltCard>
        <Link href={`/portfolio/${project.slug}`} className="s-card group block overflow-hidden">
          <div className="relative aspect-[4/3] overflow-hidden" style={{ background: "var(--s-bg-alt)" }}>
            {project.cover ? (
              <img
                src={project.cover.thumb}
                alt={project.cover.alt}
                width={project.cover.width}
                height={project.cover.height}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <img src="/brand/logo-mark-96.png" alt="" width={64} height={64} className="opacity-60" />
              </div>
            )}
            <span className="chip chip-accent absolute left-3 top-3 backdrop-blur">{categoryLabel(project.category)}</span>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-bold leading-snug">{project.title}</h3>
              <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
            <p className="s-muted mt-2 line-clamp-2 text-sm">{project.summary}</p>
            <p className="s-muted mt-3 text-xs">{[project.clientName, project.industry, project.year].filter(Boolean).join(" · ")}</p>
          </div>
        </Link>
      </TiltCard>
    </Reveal>
  );
}
