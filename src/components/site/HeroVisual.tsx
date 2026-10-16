"use client";

/* eslint-disable @next/next/no-img-element */
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useCapability } from "./three/useCapability";

// The 3D code is only downloaded for visitors who can run it, and only after the page is usable.
const HeroScene = dynamic(() => import("./three/HeroScene"), { ssr: false });

/**
 * Hero artwork. The still logo is the real first paint (and the fallback for visitors without
 * WebGL, with reduced motion, or with data saver). The 3D scene fades in over it when ready.
 */
export function HeroVisual() {
  const capability = useCapability();
  const box = useRef<HTMLDivElement>(null);
  const [idle, setIdle] = useState(false); // page has had time to become interactive
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // Safari has no requestIdleCallback, so fall back to a short timer.
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setIdle(true), { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setIdle(true), 600);
    return () => window.clearTimeout(id);
  }, []);
  // Pause rendering when the hero is off screen or the tab is hidden.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const show3d = idle && (capability === "high" || capability === "low");
  const animating = capability !== "static" && !paused;

  return (
    <div ref={box} className="relative mx-auto aspect-square w-full max-w-[34rem]">
      <div className="absolute inset-0 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--s-hero-glow), transparent 65%)" }} aria-hidden="true" />

      {/* Still logo: the first paint and the permanent fallback. */}
      <img
        src="/brand/logo-mark-dark.png"
        alt="GrovvIthUs logo: two green chevrons, the right one rising like a growth arrow"
        width={512}
        height={512}
        fetchPriority="high"
        className={`absolute inset-[8%] h-[84%] w-[84%] rounded-[2.5rem] transition-opacity duration-700 ${animating && !paused ? "gv-float" : ""} ${ready && show3d ? "opacity-0" : "opacity-100"}`}
      />

      {show3d && (
        <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} aria-hidden="true">
          <HeroScene quality={capability === "high" ? "high" : "low"} active={visible && tabVisible && !paused} onReady={() => setReady(true)} />
        </div>
      )}

      {show3d && ready && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="absolute bottom-0 right-0 inline-flex items-center gap-1.5 rounded-full border s-border px-3 py-1.5 text-xs font-semibold backdrop-blur"
          style={{ background: "color-mix(in srgb, var(--s-bg) 70%, transparent)" }}
        >
          {paused ? <Play className="h-3.5 w-3.5" aria-hidden="true" /> : <Pause className="h-3.5 w-3.5" aria-hidden="true" />}
          {paused ? "Play animation" : "Pause animation"}
        </button>
      )}
    </div>
  );
}
