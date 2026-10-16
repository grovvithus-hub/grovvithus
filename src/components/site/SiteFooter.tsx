import Link from "next/link";
import { BrandLockup } from "@/components/brand/Logo";
import { SERVICE_GROUPS, servicesInGroup } from "@/content/services";
import { FOOTER_NOTE, SITE } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="border-t s-border" style={{ background: "var(--s-bg-alt)" }}>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <BrandLockup markSize={44} className="text-2xl" themed />
          <p className="s-muted mt-4 max-w-xs text-sm">{SITE.promise}</p>
          <p className="s-muted mt-4 max-w-xs text-xs">{FOOTER_NOTE}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            {SITE.whatsapp && (
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-ghost !px-4 !py-2">
                WhatsApp
              </a>
            )}
            {SITE.email && (
              <a href={`mailto:${SITE.email}`} className="btn-ghost !px-4 !py-2">
                Email us
              </a>
            )}
            <Link href="/contact" className="btn-lime !px-4 !py-2">
              Get a quote
            </Link>
          </div>
        </div>

        <nav aria-label="Services" className="grid grid-cols-2 gap-6 md:col-span-6">
          {SERVICE_GROUPS.map((g) => (
            <div key={g.id}>
              <h2 className="font-display mb-2 text-sm font-bold">
                <Link href={`/services#${g.id}`} className="hover:text-[var(--s-accent-text)]">
                  {g.name}
                </Link>
              </h2>
              <ul className="space-y-1">
                {servicesInGroup(g.id).map((s) => (
                  <li key={s.slug}>
                    <Link href={`/services/${s.slug}`} className="s-muted text-sm hover:text-[var(--s-accent-text)]">
                      {s.name.replace(/ \(.*\)/, "")}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <nav aria-label="Company" className="md:col-span-2">
          <h2 className="font-display mb-2 text-sm font-bold">Company</h2>
          <ul className="space-y-1 text-sm">
            {[
              ["/portfolio", "Portfolio"],
              ["/pricing-models", "How pricing works"],
              ["/about", "About"],
              ["/contact", "Contact"],
              ["/terms", "Terms"],
              ["/privacy", "Privacy"],
              ["/refund-policy", "Refunds"],
              ["/cookie-policy", "Cookies"],
              ["/disclaimer", "Disclaimer"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="s-muted hover:text-[var(--s-accent-text)]">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t s-border px-5 py-5 text-center text-xs s-muted">
        &copy; {new Date().getFullYear()} {SITE.name}. {SITE.tagline} &middot;{" "}
        <Link href="/admin/login" className="hover:text-[var(--s-accent-text)]">
          Team sign in
        </Link>
      </div>
    </footer>
  );
}
