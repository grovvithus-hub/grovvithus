import { AppError } from "./errors";

/**
 * Small in-memory fixed-window rate limiter. Good enough for a single Node.js process
 * (Hostinger Node.js hosting); put Cloudflare rate-limiting rules in front for stronger protection.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    entry.count += 1;
    if (entry.count > limit) throw new AppError("Too many requests. Please wait a moment and try again.", 429);
  }
  // Keep the map from growing without bound.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }
}
