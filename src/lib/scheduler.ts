import { refreshDocumentStatuses } from "@/lib/billing/status";

/**
 * Built-in scheduled jobs, started once when the server boots (see instrumentation.ts).
 *
 * 1. Keep-awake: on hosts that put idle services to sleep (a free Render web service sleeps after 15 minutes
 *    without inbound traffic), the app requests its own public address every few minutes, which counts as traffic
 *    and stops it from sleeping. It only starts when APP_URL is a public https address, so local development and
 *    paid always-on setups are left alone. Turn it off with KEEP_AWAKE=false.
 *    Limit: code cannot wake a process that is already asleep. The scheduler restarts whenever the service starts
 *    (deploy, restart, or the first visit after a sleep) and then keeps it awake.
 *
 * 2. Status refresh: marks quotations Expired and invoices Overdue, so dashboards stay current even when nobody
 *    opens the lists (replaces an external daily cron job). It runs at start and then every 6 hours.
 *
 * Settings (all optional):
 *   KEEP_AWAKE                  "false" disables the keep-awake ping; "true" forces it on (for testing)
 *   KEEP_AWAKE_INTERVAL_SECONDS ping interval, default 600 (10 minutes), allowed 5 to 840 (Render sleeps at 900)
 *   KEEP_AWAKE_VERBOSE          "true" logs every ping instead of only the first one and failures
 */

const globalState = globalThis as unknown as { __gvScheduler?: boolean };

const isPublicHttps = (url: string) => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(u.hostname);
  } catch {
    return false;
  }
};

function startKeepAwake() {
  const setting = (process.env.KEEP_AWAKE || "").toLowerCase();
  const base = (process.env.APP_URL || "").replace(/\/$/, "");
  const enabled = setting === "true" || (setting !== "false" && process.env.NODE_ENV === "production" && isPublicHttps(base));
  if (!enabled || !base) return;

  const seconds = Math.min(Math.max(Number(process.env.KEEP_AWAKE_INTERVAL_SECONDS) || 600, 5), 840);
  const verbose = (process.env.KEEP_AWAKE_VERBOSE || "").toLowerCase() === "true";
  let count = 0;
  let lastFailed = false;

  const ping = async () => {
    count += 1;
    try {
      // The public address, not localhost: the host only counts traffic that arrives from outside.
      const res = await fetch(`${base}/api/health`, { headers: { "User-Agent": "GrovvIthUs-keep-awake" }, signal: AbortSignal.timeout(90_000), cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (verbose || count === 1 || lastFailed) console.info(`[scheduler] keep-awake ping #${count} ok (every ${seconds}s)`);
      lastFailed = false;
    } catch (err) {
      if (!lastFailed || verbose) console.warn(`[scheduler] keep-awake ping #${count} failed: ${err instanceof Error ? err.message : err}`);
      lastFailed = true;
    }
  };

  // First ping shortly after boot, once the server is accepting requests.
  setTimeout(ping, 30_000).unref();
  setInterval(ping, seconds * 1000).unref();
  console.info(`[scheduler] keep-awake started for ${base} (every ${seconds}s)`);
}

function startStatusRefresh() {
  const run = async () => {
    try {
      const result = await refreshDocumentStatuses();
      if (result.quotationsExpired || result.invoicesOverdue) console.info(`[scheduler] statuses refreshed: ${result.quotationsExpired} expired, ${result.invoicesOverdue} overdue`);
    } catch (err) {
      console.warn("[scheduler] status refresh failed:", err instanceof Error ? err.message : err);
    }
  };
  setTimeout(run, 60_000).unref();
  setInterval(run, 6 * 60 * 60 * 1000).unref();
}

export function startScheduler() {
  if (globalState.__gvScheduler) return; // already running (dev hot reload calls register again)
  globalState.__gvScheduler = true;
  startKeepAwake();
  startStatusRefresh();
}
