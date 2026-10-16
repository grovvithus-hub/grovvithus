"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

/** WhatsApp on every page, and a quote button once the visitor has scrolled past the hero. */
export function FloatingActions({ whatsapp }: { whatsapp: string }) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <Link
        href="/contact"
        tabIndex={past ? 0 : -1}
        aria-hidden={!past}
        className={`btn-lime pointer-events-auto !px-5 !py-3 text-sm shadow-lg transition-all duration-300 ${past ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      >
        Get a quote
      </Link>
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello GrovvIthUs, I would like to discuss a project.")}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
        >
          <MessageCircle className="h-7 w-7" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
