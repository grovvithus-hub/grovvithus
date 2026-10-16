import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Crumbs, SectionHeading } from "@/components/site/parts";
import { Reveal } from "@/components/site/Motion";
import { ProcessTimeline } from "@/components/site/ScrollSections";
import { SERVICE_GROUPS } from "@/content/services";
import { SITE, SKILL_GROUPS, VALUES } from "@/content/site";

export const metadata: Metadata = {
  title: "About GrovvIthUs: one team to build, market and scale your brand",
  description: "GrovvIthUs is a digital agency where developers, designers, editors and marketers work as one team, so your growth is the product we deliver.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-8">
      <Crumbs items={[{ name: "About", href: "/about" }]} />
      <h1 className="max-w-4xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">The client&apos;s growth is our product</h1>
      <p className="s-muted mt-5 max-w-2xl text-lg">
        {SITE.name} is a digital agency for businesses that want one team to build their website or app, get it found, create the content and keep everything running. The name says it: grow with us.
      </p>

      <section className="mt-20 grid gap-10 lg:grid-cols-2" aria-labelledby="idea-title">
        <div>
          <h2 id="idea-title" className="text-3xl font-bold sm:text-4xl">Why the logo looks like it does</h2>
          <p className="s-muted mt-4 text-lg">
            The mark is two chevrons side by side, matching the double &ldquo;v&rdquo; in our name. The right one is taller and ends in an arrow tip. Deep green is the starting point; lime is the growth. Things start low and rise, which is how we think about every project.
          </p>
        </div>
        <div className="s-card p-6">
          <h3 className="text-xl font-bold">Why one team matters</h3>
          <ul className="s-muted mt-3 space-y-2">
            <li>Your designer, developer, editor and marketer already know each other&apos;s work.</li>
            <li>The website is built to be found, not retrofitted for search later.</li>
            <li>One quotation, one plan and one monthly report.</li>
            <li>One person to call when something needs fixing.</li>
          </ul>
        </div>
      </section>

      <section className="mt-24" aria-labelledby="values-title">
        <SectionHeading id="values-title" eyebrow="Our values" title="How we work, in four lines" />
        <div className="grid gap-4 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.06}>
              <div className="s-card h-full p-6">
                <h3 className="text-xl font-bold">{v.title}</h3>
                <p className="s-muted mt-2">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-24" aria-labelledby="skills-about">
        <SectionHeading id="skills-about" eyebrow="Skills" title="What the team can do" />
        <div className="grid gap-4 md:grid-cols-2">
          {SKILL_GROUPS.map((g) => (
            <div key={g.name} className="s-card p-6">
              <h3 className="text-xl font-bold">{g.name}</h3>
              <p className="s-muted mt-1 text-sm">{g.blurb}</p>
              <ul className="mt-4 flex flex-wrap gap-2">{g.skills.map((s) => (<li key={s} className="chip">{s}</li>))}</ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24" aria-labelledby="groups-about">
        <SectionHeading id="groups-about" eyebrow="Services" title="Six groups, one agency" />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_GROUPS.map((g) => (
            <li key={g.id}>
              <Link href={`/services#${g.id}`} className="s-card group flex h-full items-start gap-3 p-4 transition-colors hover:border-[var(--s-accent-text)]">
                <span className="mt-1 h-8 w-1.5 shrink-0 rounded-full" style={{ background: g.color }} aria-hidden="true" />
                <span><strong className="block text-lg">{g.name}</strong><span className="s-muted text-sm">{g.benefit}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-24" aria-labelledby="process-about">
        <SectionHeading id="process-about" eyebrow="Process" title="The same six steps every time" center />
        <ProcessTimeline />
      </section>

      <section className="s-card mt-24 p-8 text-center sm:p-12">
        <h2 className="text-3xl font-bold sm:text-4xl">Let&apos;s talk about your project</h2>
        <p className="s-muted mx-auto mt-2 max-w-xl">Request a quote, book a demo or ask for a call. We usually reply within one working day.</p>
        <Link href="/contact" className="btn-lime mt-6">Get a quote <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
      </section>
    </div>
  );
}
