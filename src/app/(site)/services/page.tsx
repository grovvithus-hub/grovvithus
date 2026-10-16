import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Crumbs, JsonLd } from "@/components/site/parts";
import { Icon } from "@/components/site/Icon";
import { Reveal, TiltCard } from "@/components/site/Motion";
import { SERVICE_GROUPS, SERVICES, servicesInGroup } from "@/content/services";
import { PRICING_MODELS, SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Services: websites, apps, SEO, marketing, video and branding",
  description: "17 services in six groups: web development, WordPress, Shopify, custom software, apps, SEO, AEO, GEO, digital marketing, video, posters, logos, maintenance and consulting.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-8">
      <Crumbs items={[{ name: "Services", href: "/services" }]} />
      <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">Everything you need to build, market and grow online</h1>
      <p className="s-muted mt-5 max-w-2xl text-lg">
        17 services in six groups, delivered by one team. Pick one, or combine several. Each page explains what you get, how it works and how it is priced, without a price tag.
      </p>
      <nav aria-label="Service groups" className="mt-8 flex flex-wrap gap-2">
        {SERVICE_GROUPS.map((g) => (
          <a key={g.id} href={`#${g.id}`} className="chip hover:border-[var(--s-accent-text)]">
            {g.name}
          </a>
        ))}
      </nav>

      <div className="mt-14 space-y-20">
        {SERVICE_GROUPS.map((g) => (
          <section key={g.id} id={g.id} className="scroll-mt-28" aria-labelledby={`${g.id}-title`}>
            <div className="mb-6 flex items-center gap-4">
              <span className="h-10 w-1.5 rounded-full" style={{ background: g.color }} aria-hidden="true" />
              <div>
                <h2 id={`${g.id}-title`} className="text-3xl font-bold">{g.verb}</h2>
                <p className="s-muted">{g.benefit}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {servicesInGroup(g.id).map((s, i) => (
                <Reveal key={s.slug} delay={i * 0.05}>
                  <TiltCard className="h-full">
                    <Link href={`/services/${s.slug}`} className="s-card group flex h-full flex-col p-6 transition-colors hover:border-[var(--s-accent-text)]">
                      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-[20px]" style={{ background: "color-mix(in srgb, var(--s-accent) 22%, transparent)" }}>
                        <Icon name={s.icon} className="h-6 w-6 s-accent-text" />
                      </span>
                      <h3 className="text-xl font-bold">{s.name}</h3>
                      <p className="s-muted mt-1 flex-1 text-sm">{s.tagline}</p>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <span className="chip">{PRICING_MODELS.find((m) => m.key === s.pricingModel)?.name}</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </div>
                    </Link>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="s-card mt-24 p-8 text-center sm:p-12">
        <h2 className="text-3xl font-bold">Not sure where to start?</h2>
        <p className="s-muted mx-auto mt-2 max-w-xl">Tell us your goal. We will suggest the shortest path and explain the pricing model for it.</p>
        <Link href="/contact" className="btn-lime mt-6">Get a quote <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${SITE.name} services`,
          itemListElement: SERVICES.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, url: `${SITE.url}/services/${s.slug}` })),
        }}
      />
    </div>
  );
}
