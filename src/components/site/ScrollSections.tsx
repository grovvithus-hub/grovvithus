"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PROCESS } from "@/content/site";

/** Vertical timeline whose line fills as the visitor scrolls, lighting each step in turn. */
export function ProcessTimeline() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  const [step, setStep] = useState(reduce ? PROCESS.length : 0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(Math.min(PROCESS.length, Math.floor(v * (PROCESS.length + 0.4)) + (v > 0 ? 1 : 0))));

  return (
    <ol ref={ref} className="relative mx-auto max-w-3xl">
      <span className="absolute bottom-3 left-[1.15rem] top-3 w-0.5 rounded bg-[var(--s-border)]" aria-hidden="true" />
      <motion.span
        className="absolute left-[1.15rem] top-3 w-0.5 origin-top rounded"
        style={{ height: "calc(100% - 1.5rem)", scaleY: reduce ? 1 : fill, background: "var(--s-accent)", boxShadow: "0 0 14px var(--s-glow)" }}
        aria-hidden="true"
      />
      {PROCESS.map((p, i) => {
        const on = i < step || !!reduce;
        return (
          <li key={p.title} className="relative flex gap-5 pb-10 last:pb-0">
            <span
              className={`z-10 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-500 ${on ? "scale-100" : "scale-90"}`}
              style={{ background: on ? "var(--s-accent)" : "var(--s-bg)", color: on ? "var(--s-accent-ink)" : "var(--s-muted)", borderColor: on ? "var(--s-accent)" : "var(--s-border)", boxShadow: on ? "0 0 20px var(--s-glow)" : "none" }}
            >
              {i + 1}
            </span>
            <div className={`transition-all duration-500 ${on ? "translate-x-0 opacity-100" : "translate-x-2 opacity-50"}`}>
              <h3 className="text-2xl font-bold">{p.title}</h3>
              <p className="s-muted mt-1 max-w-lg">{p.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** The lime arm grows into a path that leads to the Get a quote button, linked to scroll. */
export function ClosingPath() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "center 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const length = useTransform(progress, [0, 1], [0, 1]);
  const buttonScale = useTransform(progress, [0.75, 1], [0.9, 1]);
  const buttonOpacity = useTransform(progress, [0.65, 1], [0.35, 1]);

  const d = "M 40 250 C 160 250, 200 130, 330 150 S 520 250, 620 150 S 780 40, 880 70";

  return (
    <div ref={ref} className="relative mx-auto max-w-5xl">
      <svg viewBox="0 0 960 300" className="h-auto w-full" role="img" aria-label="A lime path that starts low on the left and climbs to the right, ending at the Get a quote button.">
        <defs>
          <filter id="path-glow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={d} fill="none" stroke="var(--s-border)" strokeWidth="10" strokeLinecap="round" strokeDasharray="2 18" />
        <motion.path d={d} fill="none" stroke="var(--s-accent)" strokeWidth="10" strokeLinecap="round" filter="url(#path-glow)" style={{ pathLength: reduce ? 1 : length }} />
        <circle cx="40" cy="250" r="12" fill="var(--s-accent)" />
      </svg>
      <motion.div className="absolute right-0 top-[8%] sm:right-2" style={reduce ? undefined : { scale: buttonScale, opacity: buttonOpacity }}>
        <Link href="/contact" className="btn-lime text-base sm:text-lg">
          Get a quote <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </motion.div>
    </div>
  );
}
