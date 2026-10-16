"use client";

import { useSyncExternalStore } from "react";

export type Capability = "pending" | "static" | "low" | "high";

/**
 * Decides how much 3D to show:
 *  - "static": no WebGL, reduced motion, or data saver. Show the still logo / 2D version.
 *  - "low": a weak device (few cores or little memory). One simple 3D object, small pixel ratio.
 *  - "high": everything.
 * "pending" is returned during server rendering and the first client render, so markup matches.
 */
function detect(): Capability {
  if (typeof window === "undefined") return "pending";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return "static";

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return "static";
  } catch {
    return "static";
  }

  const weak = (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) || (nav.deviceMemory && nav.deviceMemory <= 2);
  return weak ? "low" : "high";
}

let cached: Capability | null = null;
const snapshot = () => (cached ??= detect());
const subscribe = (cb: () => void) => {
  // Re-evaluate if the visitor changes the reduced-motion setting while the page is open.
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = () => {
    cached = null;
    cb();
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
};

export function useCapability(): Capability {
  return useSyncExternalStore(subscribe, snapshot, () => "pending");
}
