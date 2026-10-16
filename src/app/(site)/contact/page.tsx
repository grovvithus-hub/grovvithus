import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { Crumbs } from "@/components/site/parts";
import { InquiryForm } from "@/components/site/InquiryForm";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Get a quote, book a demo or talk to us",
  description: "Tell GrovvIthUs about your project. Request a personal quotation, book a short demo, or ask for a call. We usually reply within one working day.",
  alternates: { canonical: "/contact" },
};

const INTENTS = ["QUOTE", "DEMO", "CALL"] as const;

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ service?: string; intent?: string }> }) {
  const { service, intent } = await searchParams;
  const defaultIntent = INTENTS.find((i) => i === intent) ?? "QUOTE";

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-8">
      <Crumbs items={[{ name: "Contact", href: "/contact" }]} />
      <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">Start your project</h1>
      <p className="s-muted mt-5 max-w-2xl text-lg">Pick how you would like to begin. We reply with a personal quotation, a demo time or a call, usually within one working day.</p>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.5fr_0.5fr]">
        <InquiryForm defaultService={service ?? ""} defaultIntent={defaultIntent} />
        <aside className="s-card space-y-4 p-6" aria-label="Other ways to reach us">
          <h2 className="text-xl font-bold">Prefer to talk first?</h2>
          {SITE.whatsapp ? (
            <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-ghost w-full justify-start">
              <MessageCircle className="h-5 w-5" aria-hidden="true" /> WhatsApp us
            </a>
          ) : null}
          {SITE.email ? (
            <a href={`mailto:${SITE.email}`} className="btn-ghost w-full justify-start">
              <Mail className="h-5 w-5" aria-hidden="true" /> {SITE.email}
            </a>
          ) : null}
          {!SITE.whatsapp && !SITE.email && <p className="s-muted text-sm">Use the form and choose &ldquo;Discuss on a call&rdquo;. We will phone you at the number you give.</p>}
          <p className="s-muted text-xs">We never publish a price list. We explain how pricing works for your project and send a personal quotation.</p>
        </aside>
      </div>
    </div>
  );
}
