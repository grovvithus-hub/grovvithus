"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Edit2, ExternalLink, FolderOpen, Image as ImageIcon, Plus, RotateCcw, Search, Star, Trash2, Upload, X } from "lucide-react";
import { api, errorMessage } from "@/components/billing/api";
import { useDialog } from "@/components/ui/DialogProvider";
import { Button, IconButton, Modal, PageHeader, Spinner, StatusBadge, inputClass, labelClass } from "@/components/ui/kit";
import { PORTFOLIO_CATEGORIES, categoryLabel } from "@/content/site";
import { SERVICES } from "@/content/services";
import { fmtDate } from "@/lib/billing/format";

interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  featured: boolean;
  publishedAt: string | null;
  updatedAt: string;
  coverThumb: string | null;
  mediaCount: number;
  deletedAt: string | null;
}

interface MediaItem {
  id: string;
  caption: string;
  url: string;
  thumbUrl: string;
}

interface Form {
  title: string; slug: string; clientName: string; showClientName: boolean; category: string; industry: string; year: string;
  serviceSlugs: string[]; technologies: string; summary: string; challenge: string; solution: string;
  results: { label: string; value: string }[];
  liveUrl: string; videoUrl: string;
  testimonialQuote: string; testimonialAuthor: string; testimonialRole: string;
  coverMediaId: string; media: MediaItem[];
  status: string; featured: boolean; publishedAt: string; seoTitle: string; seoDescription: string;
}

const blank = (): Form => ({
  title: "", slug: "", clientName: "", showClientName: false, category: "WEB", industry: "", year: String(new Date().getFullYear()),
  serviceSlugs: [], technologies: "", summary: "", challenge: "", solution: "", results: [],
  liveUrl: "", videoUrl: "", testimonialQuote: "", testimonialAuthor: "", testimonialRole: "",
  coverMediaId: "", media: [], status: "DRAFT", featured: false, publishedAt: "", seoTitle: "", seoDescription: "",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromApi = (p: any): Form => ({
  title: p.title, slug: p.slug, clientName: p.clientName || "", showClientName: !!p.showClientName, category: p.category, industry: p.industry || "", year: p.year ? String(p.year) : "",
  serviceSlugs: Array.isArray(p.serviceSlugs) ? p.serviceSlugs : [], technologies: Array.isArray(p.technologies) ? p.technologies.join(", ") : "",
  summary: p.summary || "", challenge: p.challenge || "", solution: p.solution || "", results: Array.isArray(p.results) ? p.results : [],
  liveUrl: p.liveUrl || "", videoUrl: p.videoUrl || "", testimonialQuote: p.testimonialQuote || "", testimonialAuthor: p.testimonialAuthor || "", testimonialRole: p.testimonialRole || "",
  coverMediaId: p.coverMediaId || "", media: (p.media || []).map((m: MediaItem) => ({ ...m, caption: m.caption || "" })),
  status: p.status, featured: !!p.featured, publishedAt: p.publishedAt ? String(p.publishedAt).slice(0, 10) : "", seoTitle: p.seoTitle || "", seoDescription: p.seoDescription || "",
});

export default function PortfolioAdminPage() {
  const { confirm, alert } = useDialog();
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ALL" | "PUBLISHED" | "DRAFT" | "TRASH">("ALL");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{ id?: string; form: Form } | null>(null);

  const load = useCallback(
    () => {
      const qs = new URLSearchParams();
      if (tab === "TRASH") qs.set("trash", "1");
      else if (tab !== "ALL") qs.set("status", tab);
      if (search) qs.set("search", search);
      return api<ProjectRow[]>(`/api/admin/projects?${qs}`)
        .then(setRows)
        .catch(() => null)
        .finally(() => setLoading(false));
    },
    [tab, search],
  );

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const open = async (id?: string) => {
    if (!id) return setEditor({ form: blank() });
    try {
      setEditor({ id, form: fromApi(await api(`/api/admin/projects/${id}`)) });
    } catch (err) {
      await alert({ title: "Could not open the project", message: errorMessage(err), variant: "error" });
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...rows];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setRows(next);
    try {
      await api("/api/admin/projects/reorder", { body: { ids: next.map((r) => r.id) } });
    } catch (err) {
      await alert({ title: "Could not save the order", message: errorMessage(err), variant: "error" });
      load();
    }
  };

  const trash = async (r: ProjectRow, restore = false) => {
    if (!restore && !(await confirm({ title: "Move to trash", message: `Move "${r.title}" to the trash? It disappears from the website and can be restored later.`, confirmText: "Move to trash", variant: "danger" }))) return;
    try {
      await api(`/api/admin/projects/${r.id}${restore ? "?restore=1" : ""}`, { method: "DELETE" });
      load();
    } catch (err) {
      await alert({ title: "Could not update the project", message: errorMessage(err), variant: "error" });
    }
  };

  const tabs: ["ALL" | "PUBLISHED" | "DRAFT" | "TRASH", string][] = [["ALL", "All"], ["PUBLISHED", "Published"], ["DRAFT", "Drafts"], ["TRASH", "Trash"]];

  return (
    <>
      <PageHeader
        title="Portfolio"
        subtitle="Add, edit, reorder and publish the projects shown on the public website. Changes go live within seconds of saving."
        action={
          <Button onClick={() => open()} className="!bg-lime !text-ink">
            <Plus className="h-4 w-4" /> Add project
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1" role="tablist">
          {tabs.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setLoading(true); setTab(k); }} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? "bg-ink text-lime" : "text-slate-600 hover:bg-slate-100"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, client or industry…" className={`${inputClass} pl-9`} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-[20px] border border-slate-200 bg-white py-16 text-center">
          <FolderOpen className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="font-bold text-slate-900">{tab === "TRASH" ? "The trash is empty" : "No projects yet"}</h3>
          {tab !== "TRASH" && <p className="mt-1 text-xs text-slate-500">Add your first project. Only real work you have permission to show.</p>}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-center gap-4 p-3 hover:bg-slate-50">
              <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {r.coverThumb ? <img src={r.coverThumb} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-slate-300" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold text-slate-900">{r.title}</span>
                  {r.featured && <Star className="h-4 w-4 fill-lime text-brand-600" aria-label="Featured" />}
                </div>
                <div className="text-xs text-slate-500">
                  {categoryLabel(r.category)} &middot; {r.mediaCount} image{r.mediaCount === 1 ? "" : "s"} &middot; updated {fmtDate(r.updatedAt)}
                </div>
              </div>
              {r.deletedAt ? (
                <StatusBadge label="In trash" cls="bg-slate-100 text-slate-600" />
              ) : r.status === "PUBLISHED" ? (
                <StatusBadge label={r.publishedAt && new Date(r.publishedAt) > new Date() ? `Scheduled ${fmtDate(r.publishedAt)}` : "Published"} cls="bg-lime/25 text-brand-900" />
              ) : (
                <StatusBadge label="Draft" cls="bg-slate-100 text-slate-600" />
              )}
              <div className="flex items-center gap-1">
                {!r.deletedAt && tab !== "TRASH" && (
                  <>
                    <IconButton title="Move up" icon={ArrowUp} onClick={() => move(i, -1)} />
                    <IconButton title="Move down" icon={ArrowDown} onClick={() => move(i, 1)} />
                    <IconButton title="Preview on the website" icon={ExternalLink} onClick={() => window.open(`/portfolio/${r.slug}?preview=1`, "_blank")} />
                    <IconButton title="Edit" icon={Edit2} onClick={() => open(r.id)} />
                    <IconButton title="Move to trash" icon={Trash2} className="text-rose-600" onClick={() => trash(r)} />
                  </>
                )}
                {r.deletedAt && <IconButton title="Restore" icon={RotateCcw} onClick={() => trash(r, true)} />}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editor && <ProjectEditor id={editor.id} initial={editor.form} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} />}
    </>
  );
}

function ProjectEditor({ id, initial, onClose, onSaved }: { id?: string; initial: Form; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Form>(initial);
  const [saving, setSaving] = useState<"save" | "publish" | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      list.forEach((file) => body.append("files", file));
      const res = await fetch("/api/admin/media", { method: "POST", body, credentials: "same-origin" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Upload failed");
      const added: MediaItem[] = json.data.map((m: { id: string; url: string; thumbUrl: string }) => ({ id: m.id, url: m.url, thumbUrl: m.thumbUrl, caption: "" }));
      setF((x) => ({ ...x, media: [...x.media, ...added], coverMediaId: x.coverMediaId || added[0]?.id || "" }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (i: number, dir: -1 | 1) =>
    setF((x) => {
      const media = [...x.media];
      const j = i + dir;
      if (j < 0 || j >= media.length) return x;
      [media[i], media[j]] = [media[j], media[i]];
      return { ...x, media };
    });

  const removeImage = (mid: string) =>
    setF((x) => {
      const media = x.media.filter((m) => m.id !== mid);
      return { ...x, media, coverMediaId: x.coverMediaId === mid ? media[0]?.id || "" : x.coverMediaId };
    });

  const save = async (publish: boolean) => {
    setSaving(publish ? "publish" : "save");
    setError("");
    try {
      const body = {
        ...f,
        status: publish ? "PUBLISHED" : f.status,
        year: f.year || null,
        technologies: f.technologies.split(",").map((t) => t.trim()).filter(Boolean),
        results: f.results.filter((r) => r.label.trim() && r.value.trim()),
        publishedAt: f.publishedAt || null,
        coverMediaId: f.coverMediaId || null,
        media: f.media.map((m) => ({ mediaId: m.id, caption: m.caption })),
      };
      if (id) await api(`/api/admin/projects/${id}`, { method: "PUT", body });
      else await api("/api/admin/projects", { body });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  const toggleService = (slug: string) => set("serviceSlugs", f.serviceSlugs.includes(slug) ? f.serviceSlugs.filter((s) => s !== slug) : [...f.serviceSlugs, slug]);

  return (
    <Modal
      size="xl"
      title={id ? `Edit ${f.title || "project"}` : "Add project"}
      subtitle="Only show work you have permission to publish. Confidential clients can stay anonymous."
      onClose={onClose}
      footer={
        <div className="space-y-2">
          {error && <p className="whitespace-pre-line text-sm text-rose-600" role="alert">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-500">Status: <strong>{f.status === "PUBLISHED" ? "Published" : "Draft"}</strong></span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="secondary" busy={saving === "save"} onClick={() => save(false)}>Save{f.status === "PUBLISHED" ? "" : " as draft"}</Button>
              {f.status !== "PUBLISHED" && <Button busy={saving === "publish"} onClick={() => save(true)}>Save &amp; publish</Button>}
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2"><label className={labelClass}>Title *</label><input value={f.title} onChange={(e) => set("title", e.target.value)} className={inputClass} placeholder="e.g. Online store for a local bakery" /></div>
          <div>
            <label className={labelClass}>Category *</label>
            <select value={f.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
              {PORTFOLIO_CATEGORIES.map((c) => (<option key={c.key} value={c.key}>{c.label}</option>))}
            </select>
          </div>
          <div><label className={labelClass}>Year</label><input type="number" value={f.year} onChange={(e) => set("year", e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Industry</label><input value={f.industry} onChange={(e) => set("industry", e.target.value)} className={inputClass} placeholder="e.g. Food and retail" /></div>
          <div><label className={labelClass}>Client name</label><input value={f.clientName} onChange={(e) => set("clientName", e.target.value)} className={inputClass} /></div>
          <label className="flex cursor-pointer items-end gap-2 pb-2 text-sm text-slate-700"><input type="checkbox" checked={f.showClientName} onChange={(e) => set("showClientName", e.target.checked)} /> Show client name publicly</label>
          <div><label className={labelClass}>Web address slug</label><input value={f.slug} onChange={(e) => set("slug", e.target.value)} className={inputClass} placeholder="auto from title" /></div>
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Images</h4>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}
            className="rounded-2xl border-2 border-dashed border-slate-300 p-4 text-center"
          >
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" onChange={(e) => e.target.files && upload(e.target.files)} />
            <Button variant="ghost" busy={uploading} onClick={() => fileInput.current?.click()}><Upload className="h-4 w-4" /> Choose images</Button>
            <p className="mt-2 text-xs text-slate-500">or drag them here. JPEG, PNG or WebP up to 10 MB each. They are converted to fast WebP automatically.</p>
          </div>
          {f.media.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {f.media.map((m, i) => (
                <li key={m.id} className="space-y-2 rounded-xl border border-slate-200 p-2">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.thumbUrl} alt={m.caption || `Project image ${i + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeImage(m.id)} className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-white hover:bg-rose-600" aria-label="Remove image"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <input value={m.caption} onChange={(e) => set("media", f.media.map((x) => (x.id === m.id ? { ...x, caption: e.target.value } : x)))} placeholder="Caption / alt text" className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs" aria-label="Image caption" />
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex cursor-pointer items-center gap-1"><input type="radio" name="cover" checked={f.coverMediaId === m.id} onChange={() => set("coverMediaId", m.id)} /> Cover</label>
                    <span className="flex gap-1">
                      <button type="button" disabled={i === 0} onClick={() => moveImage(i, -1)} className="rounded p-1 hover:bg-slate-100 disabled:opacity-30" aria-label="Move earlier"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button type="button" disabled={i === f.media.length - 1} onClick={() => moveImage(i, 1)} className="rounded p-1 hover:bg-slate-100 disabled:opacity-30" aria-label="Move later"><ArrowDown className="h-3.5 w-3.5" /></button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">The story</h4>
          <div><label className={labelClass}>One-line summary * <span className="font-normal text-slate-400">({f.summary.length}/400)</span></label><textarea rows={2} value={f.summary} onChange={(e) => set("summary", e.target.value)} className={inputClass} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className={labelClass}>The challenge</label><textarea rows={5} value={f.challenge} onChange={(e) => set("challenge", e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>What we did</label><textarea rows={5} value={f.solution} onChange={(e) => set("solution", e.target.value)} className={inputClass} /></div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between"><label className={labelClass}>Results (real numbers only, up to 6)</label>
              <button type="button" disabled={f.results.length >= 6} onClick={() => set("results", [...f.results, { label: "", value: "" }])} className="flex items-center gap-1 text-xs font-semibold text-brand-600 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Add result</button>
            </div>
            <div className="space-y-2">
              {f.results.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input value={r.label} onChange={(e) => set("results", f.results.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className={inputClass} placeholder="What improved, e.g. Organic traffic" aria-label="Result label" />
                  <input value={r.value} onChange={(e) => set("results", f.results.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} className={`${inputClass} max-w-40`} placeholder="+140%" aria-label="Result value" />
                  <button type="button" onClick={() => set("results", f.results.filter((_, j) => j !== i))} className="px-2 text-slate-400 hover:text-rose-600" aria-label="Remove result"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Services and technology</h4>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <button key={s.slug} type="button" onClick={() => toggleService(s.slug)} aria-pressed={f.serviceSlugs.includes(s.slug)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${f.serviceSlugs.includes(s.slug) ? "border-lime bg-lime text-ink" : "border-slate-300 text-slate-600 hover:border-brand-600"}`}>{s.name.replace(/ \(.*\)/, "")}</button>
            ))}
          </div>
          <div><label className={labelClass}>Technologies (comma separated)</label><input value={f.technologies} onChange={(e) => set("technologies", e.target.value)} className={inputClass} placeholder="Next.js, Shopify, Figma" /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className={labelClass}>Live website link</label><input value={f.liveUrl} onChange={(e) => set("liveUrl", e.target.value)} className={inputClass} placeholder="https://" /></div>
            <div><label className={labelClass}>Video link (YouTube, Vimeo or .mp4)</label><input value={f.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} className={inputClass} placeholder="https://" /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Client testimonial (real, with permission)</h4>
          <textarea rows={2} value={f.testimonialQuote} onChange={(e) => set("testimonialQuote", e.target.value)} className={inputClass} placeholder="What the client said" aria-label="Testimonial" />
          <div className="grid gap-4 md:grid-cols-2">
            <input value={f.testimonialAuthor} onChange={(e) => set("testimonialAuthor", e.target.value)} className={inputClass} placeholder="Name" aria-label="Testimonial author" />
            <input value={f.testimonialRole} onChange={(e) => set("testimonialRole", e.target.value)} className={inputClass} placeholder="Role and business" aria-label="Testimonial role" />
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Publishing and search</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <div><label className={labelClass}>Publish on (optional, future date schedules it)</label><input type="date" value={f.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} className={inputClass} /></div>
            <label className="flex cursor-pointer items-end gap-2 pb-2 text-sm text-slate-700"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured on the home page</label>
            <div>
              <label className={labelClass}>Status</label>
              <select value={f.status} onChange={(e) => set("status", e.target.value)} className={inputClass}><option value="DRAFT">Draft (hidden)</option><option value="PUBLISHED">Published</option></select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className={labelClass}>Search title <span className="font-normal text-slate-400">({f.seoTitle.length}/70)</span></label><input value={f.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className={inputClass} placeholder="defaults to the title" /></div>
            <div><label className={labelClass}>Search description <span className="font-normal text-slate-400">({f.seoDescription.length}/170)</span></label><input value={f.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} className={inputClass} placeholder="defaults to the summary" /></div>
          </div>
        </section>
      </div>
    </Modal>
  );
}
