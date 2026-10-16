/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, Quote } from "lucide-react";
import { Crumbs, JsonLd } from "@/components/site/parts";
import { Gallery } from "@/components/site/Gallery";
import { Reveal } from "@/components/site/Motion";
import { SERVICES } from "@/content/services";
import { SITE, categoryLabel } from "@/content/site";
import { getSessionUser } from "@/lib/auth";
import { getPublicProject, listPublicProjects, videoEmbed } from "@/lib/projects";

async function load(slug: string, preview: boolean) {
  // Drafts are only visible to a signed-in team member who asked for a preview.
  const allowDraft = preview && !!(await getSessionUser());
  return { project: await getPublicProject(slug, allowDraft), allowDraft };
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;
  const { project: p, allowDraft } = await load(slug, preview === "1");
  if (!p) return {};
  const title = p.seoTitle || `${p.title} | ${categoryLabel(p.category)} project`;
  const description = p.seoDescription || p.summary;
  return {
    title,
    description,
    alternates: { canonical: `/portfolio/${p.slug}` },
    robots: allowDraft ? { index: false, follow: false } : undefined,
    openGraph: { title, description, images: p.cover ? [{ url: p.cover.url, width: p.cover.width, height: p.cover.height, alt: p.cover.alt }] : undefined },
  };
}

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const { project: p, allowDraft } = await load(slug, preview === "1");
  if (!p) notFound();

  const services = p.serviceSlugs.map((s) => SERVICES.find((x) => x.slug === s)).filter((x): x is NonNullable<typeof x> => !!x);
  const video = videoEmbed(p.videoUrl);
  const others = (await listPublicProjects({ limit: 6 })).filter((o) => o.id !== p.id).slice(0, 3);

  return (
    <article className="mx-auto max-w-6xl px-5 pb-24 pt-8">
      {allowDraft && <p className="mb-4 rounded-2xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black">Preview: visitors only see this once it is published.</p>}
      <Crumbs items={[{ name: "Portfolio", href: "/portfolio" }, { name: p.title, href: `/portfolio/${p.slug}` }]} />

      <header className="max-w-4xl">
        <p className="chip chip-accent mb-4">{categoryLabel(p.category)}</p>
        <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">{p.title}</h1>
        <p className="s-muted mt-5 text-xl">{p.summary}</p>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {p.clientName && <div><dt className="s-muted inline">Client: </dt><dd className="inline font-semibold">{p.clientName}</dd></div>}
          {p.industry && <div><dt className="s-muted inline">Industry: </dt><dd className="inline font-semibold">{p.industry}</dd></div>}
          {p.year && <div><dt className="s-muted inline">Year: </dt><dd className="inline font-semibold">{p.year}</dd></div>}
        </dl>
        {p.liveUrl && (
          <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-6">
            Visit the live site <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </header>

      {p.cover && (
        <Reveal className="mt-10">
          <img src={p.cover.url} alt={p.cover.alt} width={p.cover.width} height={p.cover.height} fetchPriority="high" className="h-auto w-full rounded-[28px] border s-border" />
        </Reveal>
      )}

      {p.results.length > 0 && (
        <section className="mt-16" aria-labelledby="results-title">
          <h2 id="results-title" className="mb-5 text-3xl font-bold">Results</h2>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.results.map((r, i) => (
              <Reveal key={r.label} delay={i * 0.07} className="s-card p-6">
                <dd className="font-display text-5xl font-bold s-accent-text">{r.value}</dd>
                <dt className="s-muted mt-1">{r.label}</dt>
              </Reveal>
            ))}
          </dl>
        </section>
      )}

      {(p.challenge || p.solution) && (
        <section className="mt-16 grid gap-10 md:grid-cols-2">
          {p.challenge && (
            <div>
              <h2 className="mb-3 text-3xl font-bold">The challenge</h2>
              <p className="s-muted whitespace-pre-line text-lg">{p.challenge}</p>
            </div>
          )}
          {p.solution && (
            <div>
              <h2 className="mb-3 text-3xl font-bold">What we did</h2>
              <p className="s-muted whitespace-pre-line text-lg">{p.solution}</p>
            </div>
          )}
        </section>
      )}

      {video && (
        <section className="mt-16" aria-labelledby="video-title">
          <h2 id="video-title" className="mb-5 text-3xl font-bold">Watch</h2>
          <div className="aspect-video overflow-hidden rounded-[28px] border s-border">
            {video.kind === "iframe" ? (
              <iframe src={video.src} title={`${p.title} video`} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="h-full w-full" />
            ) : (
              <video src={video.src} controls preload="metadata" className="h-full w-full" />
            )}
          </div>
        </section>
      )}

      {p.media.length > 0 && (
        <section className="mt-16" aria-labelledby="gallery-title">
          <h2 id="gallery-title" className="mb-5 text-3xl font-bold">Gallery</h2>
          <Gallery items={p.media} />
        </section>
      )}

      {p.testimonial && (
        <section className="mt-16" aria-label="Client testimonial">
          <figure className="s-card relative p-8 sm:p-12">
            <Quote className="absolute right-6 top-6 h-12 w-12 opacity-15" aria-hidden="true" />
            <blockquote className="font-display max-w-3xl text-2xl font-semibold leading-snug sm:text-3xl">&ldquo;{p.testimonial.quote}&rdquo;</blockquote>
            {(p.testimonial.author || p.testimonial.role) && (
              <figcaption className="s-muted mt-5">
                <strong className="text-[var(--s-text)]">{p.testimonial.author}</strong>{p.testimonial.role ? `, ${p.testimonial.role}` : ""}
              </figcaption>
            )}
          </figure>
        </section>
      )}

      {(services.length > 0 || p.technologies.length > 0) && (
        <section className="mt-16 grid gap-8 md:grid-cols-2">
          {services.length > 0 && (
            <div>
              <h2 className="mb-3 text-2xl font-bold">Services used</h2>
              <ul className="flex flex-wrap gap-2">
                {services.map((s) => (<li key={s.slug}><Link href={`/services/${s.slug}`} className="chip hover:border-[var(--s-accent-text)]">{s.name.replace(/ \(.*\)/, "")}</Link></li>))}
              </ul>
            </div>
          )}
          {p.technologies.length > 0 && (
            <div>
              <h2 className="mb-3 text-2xl font-bold">Technology</h2>
              <ul className="flex flex-wrap gap-2">{p.technologies.map((t) => (<li key={t} className="chip">{t}</li>))}</ul>
            </div>
          )}
        </section>
      )}

      <section className="s-card mt-20 p-8 text-center sm:p-12">
        <h2 className="text-3xl font-bold sm:text-4xl">Want a result like this?</h2>
        <p className="s-muted mx-auto mt-2 max-w-xl">Tell us about your project. You get a personal quotation, or a call if you prefer to talk first.</p>
        <Link href="/contact" className="btn-lime mt-6">Get a quote <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
      </section>

      {others.length > 0 && (
        <nav className="mt-16" aria-label="More projects">
          <h2 className="mb-4 text-2xl font-bold">More projects</h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <li key={o.id}><Link href={`/portfolio/${o.slug}`} className="s-card block p-4 font-semibold transition-colors hover:border-[var(--s-accent-text)]">{o.title}</Link></li>
            ))}
          </ul>
        </nav>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: p.title,
          description: p.summary,
          url: `${SITE.url}/portfolio/${p.slug}`,
          creator: { "@type": "Organization", name: SITE.name, url: SITE.url },
          ...(p.cover ? { image: `${SITE.url}${p.cover.url}` } : {}),
          ...(p.publishedAt ? { datePublished: new Date(p.publishedAt).toISOString() } : {}),
        }}
      />
    </article>
  );
}
