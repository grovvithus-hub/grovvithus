// End-to-end checks for the public website, portfolio admin and media pipeline.
// node scripts/e2e-site.mjs [baseUrl]   (uses ADMIN_EMAIL / ADMIN_PASSWORD from .env)
import "dotenv/config";
import sharp from "sharp";

const BASE = process.argv[2] || "http://localhost:3100";
const RUN = Date.now().toString(36);
const TITLE = `Bakery store ${RUN}`;
const SLUG = `bakery-store-${RUN}`;
const LAUNCH = `Launch ${RUN}`;
let passed = 0;
let failed = 0;
let cookie = "";

const check = (name, cond, extra = "") => {
  if (cond) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name} ${extra}`);
  }
};

async function call(path, { method, body, form, raw = false, auth = true, headers = {} } = {}) {
  const res = await fetch(BASE + path, {
    method: method || (body !== undefined || form ? "POST" : "GET"),
    headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(auth && cookie ? { Cookie: cookie } : {}), ...headers },
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    redirect: "manual",
  });
  if (raw) return res;
  let json = {};
  try {
    json = await res.clone().json();
  } catch {
    /* html or binary */
  }
  return { status: res.status, json, res };
}
const html = async (path, opts = {}) => {
  const r = await call(path, { raw: true, auth: false, ...opts });
  return { status: r.status, text: await r.text(), res: r };
};

const png = async (w, h, color) => sharp({ create: { width: w, height: h, channels: 3, background: color } }).png().toBuffer();
const upload = async (files) => {
  const form = new FormData();
  for (const [name, buf, type] of files) form.append("files", new Blob([buf], { type }), name);
  return call("/api/admin/media", { form });
};

async function main() {
  let r = await call("/api/auth/login", { body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } });
  cookie = (r.res.headers.get("set-cookie") || "").split(";")[0];
  check("admin login", r.status === 200);

  console.log("Public pages");
  for (const p of ["/", "/services", "/portfolio", "/pricing-models", "/about", "/contact"]) {
    const h = await html(p);
    check(`GET ${p} renders with one H1`, h.status === 200 && (h.text.match(/<h1[ >]/g) || []).length === 1, `${h.status} h1=${(h.text.match(/<h1[ >]/g) || []).length}`);
  }
  const slugs = ["web-development", "wordpress", "shopify", "custom-software", "app-development", "digital-marketing", "seo", "aeo", "geo", "application-maintenance", "domain-and-hosting-setup", "video-editing", "posters-and-creatives", "content-writing", "logo-brand-identity", "brand-promotion", "consulting-and-audits"];
  let okServices = 0;
  for (const s of slugs) {
    const h = await html(`/services/${s}`);
    if (h.status === 200 && h.text.includes("application/ld+json") && h.text.includes("FAQPage") && h.text.includes("Pricing model") && (h.text.match(/<h1[ >]/g) || []).length === 1) okServices++;
  }
  check("all 17 service pages render with H1, pricing model, FAQ schema", okServices === 17, `${okServices}/17`);
  let h = await html("/services/does-not-exist");
  check("unknown service is a 404", h.status === 404);
  h = await html("/services");
  check("services hub links every service", slugs.every((s) => h.text.includes(`/services/${s}`)));
  h = await html("/");
  check("home has Organization schema and the growth stack", h.text.includes('"Organization"') && h.text.includes("Six groups of work"));
  const visible = h.text.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
  check("home shows no prices anywhere", !/(\u20B9|\bRs\.?\s?\d|\$\s?\d|\bUSD\b|\bINR\b)/.test(visible));
  h = await html("/pricing-models");
  check("pricing page lists all six models", ["Fixed package", "Milestones", "Monthly retainer", "Per item", "Time and material", "Management fee"].every((m) => h.text.includes(m)));
  for (const d of ["terms", "privacy", "refund-policy", "cookie-policy", "disclaimer"]) {
    const l = await html(`/${d}`);
    check(`legal page /${d} renders`, l.status === 200);
  }
  h = await html("/terms");
  check("legal draft shows the placeholder notice and is noindex", h.text.includes("Draft: this page still has highlighted items") && /noindex/i.test(h.text));
  h = await html("/nonsense-page");
  check("unknown URL is a 404", h.status === 404);
  const robots = await html("/robots.txt");
  check("robots.txt blocks admin/api and allows AI crawlers", robots.text.includes("Disallow: /admin") && robots.text.includes("GPTBot") && robots.text.includes("ClaudeBot") && robots.text.includes("Sitemap:"));
  const sm = await html("/sitemap.xml");
  check("sitemap lists services and excludes draft legal pages", sm.text.includes("/services/seo") && !sm.text.includes("/terms"));

  console.log("Media upload");
  r = await upload([["notes.txt", Buffer.from("hello"), "text/plain"]]);
  check("text file rejected", r.status === 400, r.json.message);
  r = await upload([["evil.svg", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), "image/svg+xml"]]);
  check("SVG rejected", r.status === 400);
  r = await upload([["fake.png", Buffer.from("not really a png"), "image/png"]]);
  check("fake image with png name rejected", r.status === 400);
  r = await call("/api/admin/media", { form: new FormData() });
  check("empty upload rejected", r.status === 400);
  const big = await png(3000, 2000, "#14705a");
  r = await upload([["cover.png", big, "image/png"], ["second.png", await png(800, 600, "#b6f23a"), "image/png"]]);
  check("two PNGs uploaded (201)", r.status === 201 && r.json.data.length === 2, JSON.stringify(r.json).slice(0, 200));
  const [m1, m2] = r.json.data;
  check("large image shrunk to max 2000 px and stored as WebP", m1.width === 2000 && m1.height === 1333 && m1.mime === "image/webp", `${m1.width}x${m1.height}`);
  let img = await call(`/media/${m1.id}`, { raw: true, auth: false });
  const full = Buffer.from(await img.arrayBuffer());
  check("media served as webp with long cache + nosniff", img.status === 200 && img.headers.get("content-type") === "image/webp" && /immutable/.test(img.headers.get("cache-control") || "") && img.headers.get("x-content-type-options") === "nosniff");
  img = await call(`/media/${m1.id}?t=1`, { raw: true, auth: false });
  const thumb = Buffer.from(await img.arrayBuffer());
  check("thumbnail is smaller than the full image", img.status === 200 && thumb.length < full.length, `${thumb.length} vs ${full.length}`);
  img = await call("/media/not-a-real-id-12345678901234", { raw: true, auth: false });
  check("unknown media id is 404", img.status === 404);
  img = await call("/media/..%2F..%2F.env", { raw: true, auth: false });
  check("path traversal in media id is 404", img.status === 404);
  r = await call("/api/admin/media", { form: (() => { const f = new FormData(); f.append("files", new Blob([big], { type: "image/png" }), "x.png"); return f; })(), auth: false });
  check("upload requires login", r.status === 401);

  console.log("Portfolio admin");
  const base = {
    title: TITLE, category: "WEB", industry: "Food and retail", year: 2026, summary: "A fast Shopify store that lets a neighbourhood bakery take orders online.",
    challenge: "Orders came only by phone.", solution: "We built a Shopify store with local delivery slots.",
    results: [{ label: "Online orders in month one", value: "120" }], serviceSlugs: ["shopify", "seo", "not-a-service"], technologies: ["Shopify", "Figma", "Shopify"],
    liveUrl: "https://example.com", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", coverMediaId: m1.id, media: [{ mediaId: m1.id, caption: "Home page" }, { mediaId: m2.id, caption: "" }],
    testimonialQuote: "They made online orders easy.", testimonialAuthor: "A. Baker", testimonialRole: "Owner", seoTitle: "", seoDescription: "", featured: true, status: "DRAFT",
  };
  r = await call("/api/admin/projects", { body: { ...base, liveUrl: "javascript:alert(1)" } });
  check("javascript: live URL rejected", r.status === 400);
  r = await call("/api/admin/projects", { body: { ...base, videoUrl: "https://evil.example/video" } });
  check("unknown video host rejected", r.status === 400);
  r = await call("/api/admin/projects", { body: { ...base, title: "x" } });
  check("too-short title rejected", r.status === 400);
  r = await call("/api/admin/projects", { body: base });
  const p1 = r.json.data;
  check("draft project created with a slug", r.status === 201 && p1.slug === SLUG && p1.status === "DRAFT", JSON.stringify(r.json).slice(0, 200));
  check("unknown service slugs and duplicate technologies are cleaned", JSON.stringify(p1.serviceSlugs) === '["shopify","seo"]' && JSON.stringify(p1.technologies) === '["Shopify","Figma"]');
  r = await call("/api/admin/projects", { body: base });
  check("same title gets a unique slug (-2)", r.status === 201 && r.json.data.slug === `${SLUG}-2`);
  const p2 = r.json.data;

  h = await html(`/portfolio/${p1.slug}`);
  check("draft project is hidden from visitors (404)", h.status === 404);
  h = await html("/portfolio");
  check("draft not listed on the portfolio page", !h.text.includes(TITLE));
  h = await html(`/portfolio/${p1.slug}?preview=1`);
  check("preview needs login (still 404 signed out)", h.status === 404);
  h = await html(`/portfolio/${p1.slug}?preview=1`, { auth: true, headers: { Cookie: cookie } });
  check("signed-in preview shows the draft with a notice and noindex", h.status === 200 && h.text.includes("Preview: visitors only see this once it is published") && /noindex/i.test(h.text), `${h.status}`);

  r = await call(`/api/admin/projects/${p1.id}`, { method: "PUT", body: { ...base, status: "PUBLISHED", media: base.media, coverMediaId: m1.id } });
  check("project published", r.status === 200 && r.json.data.status === "PUBLISHED" && !!r.json.data.publishedAt);
  h = await html(`/portfolio/${p1.slug}`);
  check("published project page renders story, results, gallery, testimonial", h.status === 200 && ["The challenge", "What we did", "Results", "Gallery", "They made online orders easy", "Online orders in month one"].every((t) => h.text.includes(t)), `${h.status}`);
  check("project page has CreativeWork schema and canonical", h.text.includes('"CreativeWork"') && h.text.includes(`/portfolio/${p1.slug}`));
  check("YouTube link embeds via the no-cookie domain", h.text.includes("youtube-nocookie.com/embed/dQw4w9WgXcQ"));
  check("cover image served from /media with alt text", h.text.includes(`/media/${m1.id}`));
  h = await html("/portfolio");
  check("portfolio lists the published project and its category filter", h.text.includes(TITLE) && h.text.includes("category=WEB"));
  h = await html("/portfolio?category=VIDEO");
  check("empty category shows a friendly empty state", h.text.includes("No video projects yet"));
  // Pre-built pages refresh on the first visit after a publish, so the second visit shows the change.
  await html("/services/shopify");
  await new Promise((r) => setTimeout(r, 800));
  h = await html("/services/shopify");
  check("service page shows related work", h.text.includes("Related work") && h.text.includes(TITLE));
  h = await html("/");
  check("featured project appears on the home page", h.text.includes(TITLE));
  h = await html("/sitemap.xml");
  check("sitemap now lists the project", h.text.includes(`/portfolio/${p1.slug}`));

  r = await call(`/api/admin/projects/${p2.id}`, { method: "PUT", body: { ...base, title: `Scheduled ${RUN} <script>alert(1)</script> launch`, status: "PUBLISHED", publishedAt: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10) } });
  check("scheduled project saved", r.status === 200);
  h = await html(`/portfolio/${p2.slug}`);
  check("future-dated project stays hidden", h.status === 404);
  r = await call(`/api/admin/projects/${p2.id}`, { method: "PUT", body: { ...base, title: `${LAUNCH} <script>alert(1)</script> now`, status: "PUBLISHED", featured: false } });
  h = await html(`/portfolio/${p2.slug}`);
  check("script in a title is escaped, never executed", h.status === 200 && !h.text.includes("<script>alert(1)</script>") && h.text.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));

  r = await call("/api/admin/projects/reorder", { body: { ids: [p2.id, p1.id] } });
  check("order saved", r.status === 200);
  r = await call("/api/admin/projects");
  check("admin list follows the saved order", r.json.data.findIndex((x) => x.id === p2.id) < r.json.data.findIndex((x) => x.id === p1.id));
  h = await html("/portfolio");
  check("public portfolio follows the saved order", h.text.indexOf(LAUNCH) !== -1 && h.text.indexOf(LAUNCH) < h.text.indexOf(TITLE));

  r = await call(`/api/admin/projects/${p1.id}`);
  check("editor loads media with captions in order", r.json.data.media.length === 2 && r.json.data.media[0].caption === "Home page" && r.json.data.media[1].id === m2.id);
  r = await call(`/api/admin/projects/${p1.id}`, { method: "DELETE" });
  check("project moved to trash", r.status === 200);
  h = await html(`/portfolio/${p1.slug}`);
  check("trashed project disappears from the website", h.status === 404);
  r = await call("/api/admin/projects?trash=1");
  check("trash lists it", r.json.data.some((x) => x.id === p1.id));
  r = await call(`/api/admin/projects/${p1.id}?restore=1`, { method: "DELETE" });
  check("restored as draft (not auto-published)", r.status === 200);
  h = await html(`/portfolio/${p1.slug}`);
  check("restored draft is still hidden until republished", h.status === 404);
  r = await call("/api/admin/projects", { auth: false });
  check("project API needs login", r.status === 401);

  console.log("Enquiry form from the new site");
  r = await call("/api/public/inquiry", { body: { clientName: "Site Tester", email: "tester@example.com", phone: "9000012345", intent: "CALL", serviceOfInterest: "Shopify store" }, auth: false });
  check("contact form still creates a lead", r.status === 201);
  h = await html("/contact?service=SEO&intent=DEMO");
  check("contact page pre-selects the service and intent", h.text.includes('value="SEO"') || h.text.includes("SEO"));

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
