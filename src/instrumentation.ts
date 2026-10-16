/** Runs once when the server starts. Starts the built-in scheduled jobs (see lib/scheduler.ts). */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startScheduler } = await import("@/lib/scheduler");
  startScheduler();
}
