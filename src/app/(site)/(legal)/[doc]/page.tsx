import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { Crumbs } from "@/components/site/parts";
import { LEGAL, getLegal, hasPlaceholders } from "@/content/legal";

export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL.map((d) => ({ doc: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const d = getLegal(doc);
  if (!d) return {};
  return {
    title: d.title,
    description: d.description,
    alternates: { canonical: `/${d.slug}` },
    // Keep unfinished drafts out of search results until the placeholders are replaced.
    robots: hasPlaceholders(d.body) ? { index: false, follow: true } : undefined,
  };
}

/** Marks [placeholders] and renders **bold** inside one line of text. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]|\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("[") ? (
          <mark key={i} className="rounded bg-amber-300 px-1 text-black">{p}</mark>
        ) : p.startsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = getLegal(doc);
  if (!d) notFound();

  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(<ul key={`ul-${blocks.length}`} className="s-muted my-3 list-disc space-y-1.5 pl-6">{list.map((l, i) => (<li key={i}><Inline text={l} /></li>))}</ul>);
      list = [];
    }
  };
  for (const line of d.body.split("\n")) {
    if (line.startsWith("- ")) {
      list.push(line.slice(2));
      continue;
    }
    flush();
    if (line.startsWith("## ")) blocks.push(<h2 key={blocks.length} className="mb-2 mt-9 text-2xl font-bold">{line.slice(3)}</h2>);
    else if (line.trim()) blocks.push(<p key={blocks.length} className="s-muted my-3 text-base leading-relaxed"><Inline text={line} /></p>);
  }
  flush();

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-8">
      <Crumbs items={[{ name: d.title, href: `/${d.slug}` }]} />
      <h1 className="text-4xl font-bold leading-[1.1] sm:text-5xl">{d.title}</h1>
      {hasPlaceholders(d.body) && (
        <p className="mt-6 flex gap-3 rounded-2xl bg-amber-300 p-4 text-sm font-semibold text-black" role="note">
          <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
          Draft: this page still has highlighted items to fill in. Have it reviewed by a lawyer before launch.
        </p>
      )}
      <div className="mt-4">{blocks}</div>
    </div>
  );
}
