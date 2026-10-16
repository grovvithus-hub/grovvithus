"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SERVICE_GROUPS, servicesInGroup } from "@/content/services";
import { Icon } from "./Icon";
import { useCapability } from "./three/useCapability";

const GrowthStackScene = dynamic(() => import("./three/GrowthStackScene"), { ssr: false });

/** 2D version of the stack: also the first paint and the fallback when 3D is not available. */
function FlatStack({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
  return (
    <div className="flex h-full items-end justify-center gap-2 px-4 pb-6" aria-hidden="true">
      {SERVICE_GROUPS.map((g, i) => (
        <button
          key={g.id}
          type="button"
          tabIndex={-1}
          onMouseEnter={() => onSelect(i)}
          onClick={() => onSelect(i)}
          className="w-full max-w-[3.6rem] rounded-xl border border-white/30 transition-all duration-500"
          style={{ height: `${28 + i * 11}%`, background: g.color, opacity: selected === i ? 1 : 0.75, transform: selected === i ? "translateY(-8px)" : "none", boxShadow: selected === i ? `0 0 28px ${g.color}88` : "none" }}
        />
      ))}
    </div>
  );
}

export function GrowthStack() {
  const capability = useCapability();
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [everVisible, setEverVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      setVisible(e.isIntersecting);
      if (e.isIntersecting) setEverVisible(true);
    }, { threshold: 0.15 });
    io.observe(el);
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const group = SERVICE_GROUPS[selected];
  const show3d = everVisible && (capability === "high" || capability === "low");

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div ref={box} className="relative order-2 aspect-[5/4] w-full lg:order-1" role="img" aria-label="A stack of six glass blocks, one for each service group, rising from left to right.">
        <div className="absolute inset-0 rounded-[28px] border s-border" style={{ background: "radial-gradient(ellipse at 50% 100%, var(--s-hero-glow), transparent 70%)" }} />
        <div className={`absolute inset-0 transition-opacity duration-700 ${ready && show3d ? "opacity-0" : "opacity-100"}`}>
          <FlatStack selected={selected} onSelect={setSelected} />
        </div>
        {show3d && (
          <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
            <GrowthStackScene selected={selected} onSelect={setSelected} active={visible && tabVisible} quality={capability === "high" ? "high" : "low"} onReady={() => setReady(true)} />
          </div>
        )}
      </div>

      <div className="order-1 lg:order-2">
        <div role="tablist" aria-label="Service groups" className="flex flex-wrap gap-2">
          {SERVICE_GROUPS.map((g, i) => (
            <button
              key={g.id}
              role="tab"
              aria-selected={selected === i}
              aria-controls="stack-panel"
              id={`stack-tab-${g.id}`}
              onClick={() => setSelected(i)}
              onMouseEnter={() => setSelected(i)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${selected === i ? "border-transparent bg-[var(--s-accent)] text-[var(--s-accent-ink)]" : "s-border hover:border-[var(--s-accent-text)]"}`}
            >
              {g.name}
            </button>
          ))}
        </div>
        <div id="stack-panel" role="tabpanel" aria-labelledby={`stack-tab-${group.id}`} className="mt-6">
          <h3 className="text-3xl font-bold sm:text-4xl">{group.verb}</h3>
          <p className="s-muted mt-2 max-w-md">{group.benefit}</p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {servicesInGroup(group.id).map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="s-card group flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:border-[var(--s-accent-text)]">
                  <Icon name={s.icon} className="h-5 w-5 shrink-0 s-accent-text" />
                  <span className="flex-1">{s.name.replace(/ \(.*\)/, "")}</span>
                  <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
