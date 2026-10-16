"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Item {
  id: string;
  url: string;
  thumb: string;
  width: number;
  height: number;
  alt: string;
  caption: string | null;
}

/** Image grid with a keyboard-friendly lightbox (Esc closes, arrow keys move). */
export function Gallery({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const show = (i: number) => {
    opener.current = document.activeElement as HTMLElement;
    setOpen(i);
  };
  const close = useCallback(() => {
    setOpen(null);
    opener.current?.focus();
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % items.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items.length]);

  const current = open !== null ? items[open] : null;

  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
        {items.map((m, i) => (
          <li key={m.id} className="break-inside-avoid">
            <button type="button" onClick={() => show(i)} className="s-card group block w-full overflow-hidden text-left" aria-label={`Open image ${i + 1} of ${items.length}: ${m.alt}`}>
              <img src={m.thumb} alt={m.alt} width={m.width} height={m.height} loading="lazy" decoding="async" className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]" />
              {m.caption && <span className="s-muted block px-4 py-3 text-sm">{m.caption}</span>}
            </button>
          </li>
        ))}
      </ul>

      <dialog ref={dialog} onClose={() => setOpen(null)} onClick={(e) => e.target === dialog.current && close()} className="m-auto max-h-[94vh] max-w-[96vw] bg-transparent p-0 backdrop:bg-black/85" aria-label="Image viewer">
        {current && (
          <div className="relative">
            <img src={current.url} alt={current.alt} width={current.width} height={current.height} className="max-h-[88vh] w-auto max-w-[94vw] rounded-2xl object-contain" />
            {current.caption && <p className="mt-2 text-center text-sm text-white/85">{current.caption}</p>}
            <button type="button" onClick={close} aria-label="Close" className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg"><X className="h-5 w-5" /></button>
            {items.length > 1 && (
              <>
                <button type="button" onClick={() => setOpen((open! - 1 + items.length) % items.length)} aria-label="Previous image" className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black"><ChevronLeft className="h-6 w-6" /></button>
                <button type="button" onClick={() => setOpen((open! + 1) % items.length)} aria-label="Next image" className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black"><ChevronRight className="h-6 w-6" /></button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
