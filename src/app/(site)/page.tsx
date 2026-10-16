import Link from "next/link";
import { ArrowRight, BarChart3, Layers, Repeat } from "lucide-react";
import { HeroVisual } from "@/components/site/HeroVisual";
import { GrowthStack } from "@/components/site/GrowthStack";
import { ClosingPath, ProcessTimeline } from "@/components/site/ScrollSections";
import { Faq, JsonLd, Marquee, ProjectCard, SectionHeading } from "@/components/site/parts";
import { Icon } from "@/components/site/Icon";
import { Reveal, TiltCard } from "@/components/site/Motion";
import { RiseWords } from "@/components/site/Rise";
import { SERVICES, getService } from "@/content/services";
import { PORTFOLIO_CATEGORIES, PRICING_MODELS, SITE, SKILL_GROUPS, VALUES } from "@/content/site";
import { listPublicProjects } from "@/lib/projects";

export const revalidate = 60;

const HERO_SERVICES = [
  { slug: "web-development", title: "Websites", text: "Fast, secure sites that turn visitors into enquiries." },
  { slug: "app-development", title: "Apps and software", text: "Android, iOS and custom systems built around how you work." },
  { slug: "seo", title: "Marketing and search", text: "SEO, answer-engine and ad work that brings the right people." },
  { slug: "video-editing", title: "Creative", text: "Videos, posters and brand design in one consistent style." },
];

const HOME_FAQ = [
  { q: "What does GrovvIthUs do?", a: "GrovvIthUs is a digital agency that builds, markets and maintains your online presence: websites, apps and custom software, SEO, ads and social media, video, posters, logos and ongoing care. One team handles all of it, so you manage one relationship instead of five." },
  { q: "Why are there no prices on the website?", a: "Every project is different, and a price list would mislead you. Instead we explain how pricing works for each service, then send a personal quotation that shows exactly what is included, the pricing model and the timeline." },
  { q: "How does a project start?", a: "You request a quote, book a demo or ask for a call. We hold a short discovery conversation, then send a clear quotation. When you accept it, we design first, you approve the design, and we build in small steps you can follow." },
  { q: "Will I own my website, logo and files?", a: "Yes. After full payment you own the final deliverables made for you. We keep our general tools and know-how, and we tell you clearly about any third-party licences." },
  { q: "Do you look after the project after launch?", a: "Yes. Monthly maintenance, marketing and SEO plans keep things updated, secure and growing, with a clear report every month." },
  { q: "Can you promise rankings, leads or sales?", a: "No honest agency can, because search engines, ad platforms and markets change. We promise clear work, honest reporting and steady improvement, and we show the numbers." },
];

export default async function HomePage() {
  let featured = await listPublicProjects({ featuredOnly: true, limit: 3 });
  if (featured.length < 3) {
    const more = await listPublicProjects({ limit: 3 });
    featured = [...featured, ...more.filter((m) => !featured.some((f) => f.id === m.id))].slice(0, 3);
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", "@id": `${SITE.url}/#org`, name: SITE.name, url: SITE.url, logo: `${SITE.url}/brand/logo-mark.png`, slogan: SITE.tagline, description: SITE.promise },
            { "@type": "WebSite", "@id": `${SITE.url}/#site`, name: SITE.name, url: SITE.url, publisher: { "@id": `${SITE.url}/#org` } },
            {
              "@type": "ProfessionalService",
              name: SITE.name,
              url: SITE.url,
              description: SITE.promise,
              hasOfferCatalog: { "@type": "OfferCatalog", name: "Services", itemListElement: SERVICES.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.name, url: `${SITE.url}/services/${s.slug}` } })) },
            },
          ],
        }}
      />

      {/* 1. Hero */}
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem]" style={{ background: "radial-gradient(ellipse at 75% 0%, var(--s-hero-glow), transparent 60%)" }} aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-8 md:pt-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="chip chip-accent mb-5">
              <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: "var(--s-accent-text)" }} /> Now open for projects
            </p>
            <h1 id="hero-title" className="text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
              <RiseWords words={[{ text: "Grow" }, { text: "with", accent: true }, { text: "us." }]} />
            </h1>
            <div className="gv-fade-up" style={{ "--d": "0.4s" } as React.CSSProperties}>
              <p className="s-muted mt-6 max-w-xl text-lg sm:text-xl">{SITE.promise}</p>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="What we do">
                {["Websites", "Apps", "SEO", "Ads", "Video", "Branding"].map((p) => (
                  <li key={p} className="chip" style={{ borderColor: "var(--s-accent-text)" }}>{p}</li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/contact" className="btn-lime text-base">Get a quote <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
                <Link href="/portfolio" className="btn-ghost text-base">See our work</Link>
              </div>
              <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 text-sm">
                {[
                  [Layers, "One team", "Build, market and care in one place"],
                  [BarChart3, "Clear pricing models", "A personal quotation, no guessing"],
                  [Repeat, "Monthly reports", "Plain-English results every month"],
                ].map(([Ico, t, d]) => {
                  const I = Ico as typeof Layers;
                  return (
                    <div key={t as string}>
                      <dt className="flex items-center gap-2 font-bold"><I className="h-4 w-4 s-accent-text" aria-hidden="true" />{t as string}</dt>
                      <dd className="s-muted mt-1 text-xs">{d as string}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <Marquee items={SERVICES.map((s) => s.name.replace(/ \(.*\)/, ""))} />

      {/* 2. Four hero services */}
      <section className="mx-auto max-w-6xl px-5 py-24" aria-labelledby="what-we-do">
        <SectionHeading id="what-we-do" eyebrow="What we do" title="Everything your brand needs online, from one team" text="Start with the part you need most. We connect the rest when you are ready." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HERO_SERVICES.map((h, i) => {
            const s = getService(h.slug)!;
            return (
              <Reveal key={h.slug} delay={i * 0.08}>
                <TiltCard className="h-full">
                  <Link href={`/services/${s.slug}`} className="s-card group flex h-full flex-col p-6 transition-colors hover:border-[var(--s-accent-text)]">
                    <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-[24px]" style={{ background: "color-mix(in srgb, var(--s-accent) 22%, transparent)" }}>
                      <Icon name={s.icon} className="h-7 w-7 s-accent-text" />
                    </span>
                    <h3 className="text-2xl font-bold">{h.title}</h3>
                    <p className="s-muted mt-2 flex-1">{h.text}</p>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold s-accent-text">
                      Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </Link>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-8 text-center">
          <Link href="/services" className="btn-ghost">See all 17 services</Link>
        </p>
      </section>

      {/* 3. Growth stack */}
      <section className="s-bg-alt py-24" aria-labelledby="stack-title">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading id="stack-title" eyebrow="How the pieces fit" title="Six groups of work that rise together" text="Hover or tap a block to see what is inside. Each group links to its services." />
          <GrowthStack />
        </div>
      </section>

      {/* 4. Process */}
      <section className="mx-auto max-w-6xl px-5 py-24" aria-labelledby="process-title">
        <SectionHeading id="process-title" eyebrow="How we work" title="From first call to steady growth" text="The same six steps on every project, so you always know what happens next." center />
        <ProcessTimeline />
      </section>

      {/* 5. Featured work */}
      <section className="s-bg-alt py-24" aria-labelledby="work-title">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading id="work-title" eyebrow="Our work" title="Projects we are proud of" text="Real work for real businesses, with the problem, the approach and the result." />
            <Link href="/portfolio" className="btn-ghost mb-10">View the portfolio</Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {featured.map((p) => (<ProjectCard key={p.id} project={p} />))}
            </div>
          ) : (
            <Reveal>
              <div className="s-card p-8 text-center sm:p-12">
                <p className="font-display text-2xl font-bold">Our case studies are being added</p>
                <p className="s-muted mx-auto mt-2 max-w-xl">We only show work we have permission to share. Meanwhile, explore what we build, by category.</p>
                <ul className="mt-6 flex flex-wrap justify-center gap-2">
                  {PORTFOLIO_CATEGORIES.filter((c) => c.key !== "OTHER").map((c) => (
                    <li key={c.key}><Link href={`/portfolio?category=${c.key}`} className="chip hover:border-[var(--s-accent-text)]">{c.label}</Link></li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* 6. Skills and talent */}
      <section className="mx-auto max-w-6xl px-5 py-24" aria-labelledby="skills-title">
        <SectionHeading id="skills-title" eyebrow="Skills and talent" title="Engineers, marketers and creatives on one team" text="The skills behind the work, so you do not need to hire five different specialists." />
        <div className="grid gap-5 md:grid-cols-2">
          {SKILL_GROUPS.map((g, i) => (
            <Reveal key={g.name} delay={i * 0.07}>
              <div className="s-card h-full p-6">
                <h3 className="text-2xl font-bold">{g.name}</h3>
                <p className="s-muted mt-1 text-sm">{g.blurb}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {g.skills.map((s) => (<li key={s} className="chip">{s}</li>))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.06}>
              <div className="h-full border-l-2 pl-4" style={{ borderColor: "var(--s-accent)" }}>
                <h3 className="text-lg font-bold">{v.title}</h3>
                <p className="s-muted mt-1 text-sm">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 7. Pricing models */}
      <section className="s-bg-alt py-24" aria-labelledby="pricing-title">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading id="pricing-title" eyebrow="Pricing models" title="Clear pricing models, no price tags" text="We never publish a price list. We explain how your project will be priced, then send a personal quotation." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRICING_MODELS.map((m, i) => (
              <Reveal key={m.key} delay={i * 0.05}>
                <div className="s-card h-full p-6">
                  <span className="chip chip-accent">{m.name}</span>
                  <p className="mt-3 text-lg font-bold">{m.short}</p>
                  <p className="s-muted mt-1 text-sm">Best for: {m.for}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-8"><Link href="/pricing-models" className="btn-ghost">How pricing works</Link></p>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="mx-auto max-w-4xl px-5 py-24">
        <Faq items={HOME_FAQ} />
      </section>

      {/* 9. Closing call to action */}
      <section className="overflow-hidden px-5 pb-28 pt-8" aria-labelledby="cta-title">
        <div className="mx-auto max-w-5xl text-center">
          <h2 id="cta-title" className="text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">Ready to grow with us?</h2>
          <p className="s-muted mx-auto mt-4 max-w-xl text-lg">Tell us about your project. We reply with a personal quotation, or a call if you prefer to talk first.</p>
        </div>
        <div className="mt-10">
          <ClosingPath />
        </div>
      </section>
    </>
  );
}
