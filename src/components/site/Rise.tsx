/**
 * Headline whose words rise one after another. Pure CSS (no JavaScript), so the text is in the first paint
 * and never waits for hydration: it is the page's largest contentful paint.
 */
export function RiseWords({ words, className = "" }: { words: { text: string; accent?: boolean }[]; className?: string }) {
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <span className={`gv-word inline-block ${w.accent ? "s-accent-text" : ""}`} style={{ "--d": `${0.1 + i * 0.09}s` } as React.CSSProperties}>
            {w.text}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </span>
  );
}
