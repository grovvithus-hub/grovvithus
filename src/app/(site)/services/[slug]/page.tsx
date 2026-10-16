import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Crumbs, Faq, JsonLd, ProjectCard } from "@/components/site/parts";
import { Icon } from "@/components/site/Icon";
import { Reveal } from "@/components/site/Motion";
import { SERVICES, getService, groupOf } from "@/content/services";
import { PRICING_MODELS, SITE } from "@/content/site";
import { listPublicProjects } from "@/lib/projects";

export const revalidate = 60;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = getService(slug);
  if (!s) return {};
  const description = s.answer.length > 158 ? `${s.answer.slice(0, 155).replace(/\s+\S*$/, "")}...` : s.answer;
  return {
    title: `${s.name}: ${s.tagline.replace(/\.$/, "")}`,
    description,
    alternates: { canonical: `/services/${s.slug}` },
    openGraph: { title: `${s.name} | ${SITE.name}`, description },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getService(slug);
  if (!s) notFound();
  const group = groupOf(s);
  const model = PRICING_MODELS.find((m) => m.key === s.pricingModel)!;
  const related = s.related.map((r) => getService(r)).filter((x): x is NonNullable<typeof x> => !!x);
  const projects = (await listPublicProjects({ limit: 60 })).filter((p) => p.serviceSlugs.includes(s.slug)).slice(0, 3);
  const short = s.name.replace(/ \(.*\)/, "");

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-8">
      <Crumbs items={[{ name: "Services", href: "/services" }, { name: short, href: `/services/${s.slug}` }]} />

      <header className="grid items-start gap-10 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="chip chip-accent mb-4"><Icon name={s.icon} className="mr-2 h-4 w-4" /> {group.name}</p>
          <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">{s.name}</h1>
          <p className="mt-3 text-2xl font-semibold s-accent-text">{s.tagline}</p>
          {/* Plain-English answer first: good for readers, snippets and AI answers. */}
          <p className="s-muted mt-6 max-w-2xl text-lg">{s.answer}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/contact?service=${encodeURIComponent(short)}`} className="btn-lime text-base">Request a quote <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
            <Link href={`/contact?service=${encodeURIComponent(short)}&intent=DEMO`} className="btn-ghost text-base">Book a demo</Link>
          </div>
        </div>
        <aside className="s-card p-6" aria-label="How it is priced">
          <p className="s-muted text-xs font-bold uppercase tracking-wider">Pricing model</p>
          <p className="font-display mt-1 text-2xl font-bold">{model.name}</p>
          <p className="s-muted mt-2 text-sm">{model.how}</p>
          <p className="mt-3 text-sm"><strong>How we quote:</strong> <span className="s-muted">{model.quote}</span></p>
          <Link href="/pricing-models" className="mt-4 inline-flex items-center gap-1 text-sm font-bold s-accent-text hover:underline">All pricing models <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </aside>
      </header>

      <section className="mt-20" aria-labelledby="get-title">
        <h2 id="get-title" className="mb-6 text-3xl font-bold sm:text-4xl">What you get</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {s.deliverables.map((d, i) => (
            <Reveal as="li" key={d} delay={i * 0.04} className="s-card flex items-start gap-3 p-4">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--s-accent)", color: "var(--s-accent-ink)" }}><Check className="h-4 w-4" aria-hidden="true" /></span>
              <span>{d}</span>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="mt-20" aria-labelledby="how-title">
        <h2 id="how-title" className="mb-6 text-3xl font-bold sm:text-4xl">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-4">
          {s.process.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.08} className="s-card p-5">
              <span className="font-display text-4xl font-bold s-accent-text">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 text-xl font-bold">{p.title}</h3>
              <p className="s-muted mt-1 text-sm">{p.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="mt-20" aria-labelledby="tools-title">
        <h2 id="tools-title" className="mb-4 text-2xl font-bold">Tools and technologies</h2>
        <ul className="flex flex-wrap gap-2">
          {s.tools.map((t) => (<li key={t} className="chip">{t}</li>))}
        </ul>
      </section>

      {projects.length > 0 && (
        <section className="mt-20" aria-labelledby="related-work">
          <h2 id="related-work" className="mb-6 text-3xl font-bold sm:text-4xl">Related work</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {projects.map((p) => (<ProjectCard key={p.id} project={p} />))}
          </div>
        </section>
      )}

      <section className="mt-20 max-w-4xl">
        <Faq items={s.faqs} title={`${short}: common questions`} />
      </section>

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="also-title">
          <h2 id="also-title" className="mb-4 text-2xl font-bold">Often combined with</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.slug} href={`/services/${r.slug}`} className="s-card group flex items-center gap-3 p-4 transition-colors hover:border-[var(--s-accent-text)]">
                <Icon name={r.icon} className="h-6 w-6 shrink-0 s-accent-text" />
                <span className="flex-1 font-semibold">{r.name.replace(/ \(.*\)/, "")}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="s-card mt-20 p-8 text-center sm:p-12">
        <h2 className="text-3xl font-bold sm:text-4xl">Ready for {short.toLowerCase()}?</h2>
        <p className="s-muted mx-auto mt-2 max-w-xl">Tell us what you need. You get a personal quotation, with the pricing model explained, or a call if you prefer to talk first.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/contact?service=${encodeURIComponent(short)}`} className="btn-lime">Request a quote</Link>
          <Link href={`/contact?service=${encodeURIComponent(short)}&intent=CALL`} className="btn-ghost">Discuss on a call</Link>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: s.name,
          description: s.answer,
          serviceType: group.name,
          url: `${SITE.url}/services/${s.slug}`,
          provider: { "@type": "Organization", name: SITE.name, url: SITE.url },
        }}
      />
    </div>
  );
}
