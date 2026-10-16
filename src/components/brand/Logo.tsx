/* eslint-disable @next/next/no-img-element */

/** The 3D double-v mark on the brand near-black (#0F1412). Use on dark surfaces. */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <img src="/brand/logo-mark-dark.png" width={size} height={size} alt="" aria-hidden="true" className={`rounded-xl ${className}`} />;
}

/**
 * "GrovvIthUs" with the lime "vv", set in Sora like the logo lockup.
 * `themed` follows the public website's light/dark theme instead of a fixed colour.
 */
export function Wordmark({ className = "text-xl", light = true, themed = false }: { className?: string; light?: boolean; themed?: boolean }) {
  const base = themed ? "" : light ? "text-paper" : "text-ink";
  const accent = themed ? "s-accent-text" : light ? "text-lime" : "text-brand-600";
  return (
    <span className={`font-display font-bold tracking-tight ${base} ${className}`} style={themed ? { color: "var(--s-text)" } : undefined} aria-label="GrovvIthUs">
      Gro<span className={accent}>vv</span>IthUs
    </span>
  );
}

export function BrandLockup({ markSize = 36, className = "text-xl", light = true, themed = false }: { markSize?: number; className?: string; light?: boolean; themed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={markSize} />
      <Wordmark className={className} light={light} themed={themed} />
    </span>
  );
}
