"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, MessageCircle, X } from "lucide-react";
import { BrandLockup } from "@/components/brand/Logo";
import { Icon } from "./Icon";
import { ThemeToggle } from "./ThemeToggle";
import { SERVICE_GROUPS, servicesInGroup, type GroupId } from "@/content/services";

const LINKS = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/pricing-models", label: "How pricing works" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ whatsapp }: { whatsapp: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [group, setGroup] = useState<GroupId>("build");
  const [menu, setMenu] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation, Escape and outside click.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMega(false);
    setMenu(false);
  }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMega(false);
        setMenu(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setMega(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  const active = SERVICE_GROUPS.find((g) => g.id === group)!;
  const linkClass = (href: string) =>
    `rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:text-[var(--s-accent-text)] ${pathname.startsWith(href) ? "s-accent-text" : ""}`;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "border-b s-border backdrop-blur-xl" : ""}`}
      style={{ background: scrolled ? "color-mix(in srgb, var(--s-bg) 93%, transparent)" : "transparent" }}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-[var(--s-accent)] focus:px-4 focus:py-2 focus:text-[var(--s-accent-ink)]">
        Skip to content
      </a>
      <div ref={wrap} className={`mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 transition-all duration-300 ${scrolled ? "py-2.5" : "py-5"}`}>
        <Link href="/" aria-label="GrovvIthUs home" className="shrink-0">
          <BrandLockup markSize={scrolled ? 34 : 40} className="text-xl" themed />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          <div className="relative">
            <button
              type="button"
              aria-expanded={mega}
              aria-controls="mega-menu"
              onClick={() => setMega((m) => !m)}
              onMouseEnter={() => setMega(true)}
              className={`flex items-center gap-1 ${linkClass("/services")}`}
            >
              Services <ChevronDown className={`h-4 w-4 transition-transform ${mega ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {mega && (
              <div
                id="mega-menu"
                onMouseLeave={() => setMega(false)}
                className="absolute left-1/2 top-full mt-3 grid w-[44rem] -translate-x-1/2 grid-cols-[14rem_1fr] overflow-hidden rounded-[20px] border s-border shadow-2xl"
                style={{ background: "var(--s-surface-strong)" }}
              >
                <ul className="border-r s-border p-3">
                  {SERVICE_GROUPS.map((g) => (
                    <li key={g.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setGroup(g.id)}
                        onFocus={() => setGroup(g.id)}
                        onClick={() => setGroup(g.id)}
                        aria-current={group === g.id}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${group === g.id ? "chip-accent" : "hover:bg-[var(--s-surface)]"}`}
                      >
                        {g.name}
                        <span className="text-xs font-normal opacity-70">{servicesInGroup(g.id).length}</span>
                      </button>
                    </li>
                  ))}
                  <li className="mt-2 border-t s-border pt-2">
                    <Link href="/services" className="block rounded-xl px-3 py-2 text-sm font-semibold s-accent-text hover:underline">
                      All 17 services
                    </Link>
                  </li>
                </ul>
                <div className="p-5">
                  <p className="font-display text-lg font-bold">{active.verb}</p>
                  <p className="s-muted mb-3 text-sm">{active.benefit}</p>
                  <ul className="grid grid-cols-2 gap-1">
                    {servicesInGroup(group).map((s) => (
                      <li key={s.slug}>
                        <Link href={`/services/${s.slug}`} className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm hover:bg-[var(--s-surface)] hover:text-[var(--s-accent-text)]">
                          <Icon name={s.icon} className="h-4 w-4 shrink-0 s-accent-text" />
                          {s.name.replace(/ \(.*\)/, "")}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/contact" className="btn-lime !hidden whitespace-nowrap !px-5 !py-2.5 text-sm sm:!inline-flex">
            Get a quote
          </Link>
          <button type="button" onClick={() => setMenu(true)} aria-label="Open menu" aria-expanded={menu} className="inline-flex h-10 w-10 items-center justify-center rounded-full border s-border lg:hidden">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {menu && (
        <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto px-6 pb-6 pt-5 lg:hidden" style={{ background: "var(--s-bg)" }} role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex items-center justify-between">
            <BrandLockup markSize={36} className="text-xl" themed />
            <button type="button" onClick={() => setMenu(false)} aria-label="Close menu" className="inline-flex h-11 w-11 items-center justify-center rounded-full border s-border">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Mobile" className="mt-8 flex flex-1 flex-col gap-1">
            <Link href="/services" className="font-display rounded-2xl px-3 py-3 text-3xl font-bold">
              Services
            </Link>
            <ul className="mb-2 grid grid-cols-2 gap-2 px-3">
              {SERVICE_GROUPS.map((g) => (
                <li key={g.id}>
                  <Link href={`/services#${g.id}`} className="chip block w-full justify-center py-2.5 text-center">
                    {g.name}
                  </Link>
                </li>
              ))}
            </ul>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="font-display rounded-2xl px-3 py-3 text-3xl font-bold">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 grid gap-3">
            <Link href="/contact" className="btn-lime w-full text-lg">
              Get a quote
            </Link>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-ghost w-full text-lg">
                <MessageCircle className="h-5 w-5" aria-hidden="true" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
