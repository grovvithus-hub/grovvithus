import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Crumbs, Faq } from "@/components/site/parts";
import { Reveal } from "@/components/site/Motion";
import { InquiryForm } from "@/components/site/InquiryForm";
import { SERVICES } from "@/content/services";
import { PRICING_MODELS } from "@/content/site";

export const metadata: Metadata = {
  title: "How pricing works: six simple models, a personal quotation",
  description: "We do not publish a price list. See the six pricing models we use (fixed package, milestones, monthly retainer, per item, time and material, management fee) and what affects the cost of a website, app or marketing plan.",
  alternates: { canonical: "/pricing-models" },
};

const FACTORS = [
  "The number of pages, screens or items",
  "Custom features and integrations (payments, WhatsApp, accounting, APIs)",
  "How much content, photography or video already exists",
  "Design depth: template-based or fully custom",
  "Timeline: a faster launch needs more people at once",
  "Ongoing care: maintenance, SEO, marketing and reporting",
];

const FAQ = [
  { q: "How much does a website cost?", a: "It depends on the number of pages, the features and how much content is ready. We do not publish prices because the same word, 'website', can mean a five-page brochure or a full online store. Tell us what you need and we send a personal quotation, usually within one to two working days." },
  { q: "Is the quotation a binding price?", a: "The quotation shows the scope, the pricing model and the amount for that scope, valid for the dates on it. If your needs change, we send an updated quotation. You never pay for work you did not agree to." },
  { q: "Are there hidden costs?", a: "No. Third-party costs such as the domain, hosting, plugins, stock media and advertising spend are listed separately and paid at actual cost, so you can see them clearly." },
  { q: "Can I start small and add more later?", a: "Yes. Many clients start with one package, such as a website, and add SEO, marketing or maintenance later. Everything we build is designed to grow." },
  { q: "How do payments work?", a: "For fixed packages and milestones, we usually take an advance before work starts and the rest at agreed steps. Monthly services are paid monthly in advance. The quotation lists the exact schedule." },
];

export default function PricingModelsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-8">
      <Crumbs items={[{ name: "How pricing works", href: "/pricing-models" }]} />
      <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">Clear pricing models. A personal quotation.</h1>
      <p className="s-muted mt-5 max-w-2xl text-lg">
        We do not publish a price list, because every project is different. Instead, each service uses one of six simple models, and you receive a written quotation that shows exactly what is included.
      </p>

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PRICING_MODELS.map((m, i) => (
          <Reveal key={m.key} delay={i * 0.06}>
            <section className="s-card flex h-full flex-col p-6" aria-labelledby={`m-${m.key}`}>
              <span className="chip chip-accent w-fit">{m.name}</span>
              <h2 id={`m-${m.key}`} className="mt-3 text-2xl font-bold">{m.short}</h2>
              <p className="s-muted mt-2">{m.how}</p>
              <dl className="mt-4 space-y-2 border-t s-border pt-4 text-sm">
                <div><dt className="font-bold">Best for</dt><dd className="s-muted">{m.for}</dd></div>
                <div><dt className="font-bold">How we quote</dt><dd className="s-muted">{m.quote}</dd></div>
                <div>
                  <dt className="font-bold">Used by</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {SERVICES.filter((s) => s.pricingModel === m.key).map((s) => (
                      <Link key={s.slug} href={`/services/${s.slug}`} className="chip hover:border-[var(--s-accent-text)]">{s.name.replace(/ \(.*\)/, "")}</Link>
                    ))}
                  </dd>
                </div>
              </dl>
            </section>
          </Reveal>
        ))}
      </div>

      <section className="mt-20 grid gap-10 lg:grid-cols-2" aria-labelledby="factors-title">
        <div>
          <h2 id="factors-title" className="text-3xl font-bold sm:text-4xl">What affects the cost</h2>
          <p className="s-muted mt-3">These are the questions we ask in discovery. Knowing them early keeps your quotation accurate.</p>
        </div>
        <ul className="space-y-3">
          {FACTORS.map((f) => (
            <li key={f} className="s-card flex items-start gap-3 p-4">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--s-accent)", color: "var(--s-accent-ink)" }}><Check className="h-4 w-4" aria-hidden="true" /></span>
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20 max-w-4xl"><Faq items={FAQ} title="Pricing questions" /></section>

      <section className="mt-20" aria-labelledby="quote-title">
        <h2 id="quote-title" className="text-3xl font-bold sm:text-4xl">Get your personal quotation</h2>
        <p className="s-muted mb-6 mt-2 max-w-xl">Tell us about your project, or ask for a demo or call first.</p>
        <div className="max-w-3xl"><InquiryForm /></div>
        <p className="mt-6"><Link href="/services" className="inline-flex items-center gap-1 font-bold s-accent-text hover:underline">Browse all services <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></p>
      </section>
    </div>
  );
}
