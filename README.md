# GrovvIthUs

Agency website, portfolio and admin panel.

- **Public website** (animated, with 3D): home, 17 service pages in 6 groups, portfolio with case studies, how pricing works, about, contact, and the five legal pages.
- **Admin panel** (`/admin`): portfolio management, leads, quotations, invoices, clients and billing settings.

Stack: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Prisma 6 (SQLite locally, PostgreSQL on Render, MySQL on Hostinger; chosen automatically from `DATABASE_URL`), Three.js with React Three Fiber, Framer Motion, sharp, PDFKit, Nodemailer.

## Run it locally

```bash
npm install
cp .env.example .env     # then fill AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, CRON_SECRET
npm run db:push          # creates prisma/dev.db
npm run seed             # creates the first Super Admin and a starter company
npm run dev              # http://localhost:3000  (admin: /admin)
```

Generate secrets with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
`ADMIN_PASSWORD` must be at least 12 characters. Emails are not sent until you set the `SMTP_*` values and `DISABLE_EMAILS=false`.

Optional public settings: `NEXT_PUBLIC_WHATSAPP_NUMBER` (digits with country code, shows the WhatsApp button and links) and `NEXT_PUBLIC_CONTACT_EMAIL`. Uploaded portfolio images are stored in the database, so they survive redeploys on any host and are included in database backups.

## Tests

With a built server running (`npm run build && npx next start -p 3100`):

```bash
node scripts/e2e.mjs        http://localhost:3100   # quotations, invoices, GST, PDFs, payments (74 checks)
node scripts/e2e-site.mjs   http://localhost:3100   # public site, SEO files, portfolio, uploads (68 checks)
node scripts/e2e-roles.mjs  http://localhost:3100   # who can open what (14 checks)
```

`npm run typecheck` and `npm run lint` must also be clean. The tests create sample data: use a throwaway database (delete `prisma/dev.db`, then `npm run db:push && npm run seed`).

## The public website

| Page | What it shows |
| --- | --- |
| `/` | 3D hero built from the logo, services marquee, four hero services, 3D growth stack (six service groups), scroll-linked process, featured work, skills, pricing models, FAQ, closing call to action |
| `/services`, `/services/[slug]` | Hub and 17 pages: plain answer first, what you get, process, pricing model, tools, related work, FAQ with schema |
| `/portfolio`, `/portfolio/[slug]` | Filterable grid and case studies (results, story, gallery with lightbox, video, testimonial) |
| `/pricing-models` | Six pricing models and what affects cost; no prices anywhere |
| `/about`, `/contact` | Values, skills, process; quote / demo / call form that creates a lead |
| `/terms`, `/privacy`, `/refund-policy`, `/cookie-policy`, `/disclaimer` | Templates with highlighted `[placeholders]`. They stay `noindex` and show a draft notice until every placeholder is replaced. Have a lawyer review them. |

Design follows the UI/UX document: near-black `#0F1412`, lime `#B6F23A`, deep green, Sora and Inter, pill buttons, 20 px cards. Dark and light themes both work; the theme follows the device until the visitor chooses.

**3D and performance.** 3D is loaded only after the page is usable, in three places. The still logo is the first paint and the permanent fallback for visitors with no WebGL, reduced motion or data saver. Rendering pauses off screen and in hidden tabs, weak devices get a lighter scene, and a visible "Pause animation" button is provided. Headline and text are server-rendered and animated with CSS, so nothing waits for JavaScript. The home page ships about 243 KB of gzipped JavaScript before the 3D chunks.

**SEO, AEO and GEO.** One H1 per page, answer-first copy, FAQ / Service / Organization / Breadcrumb / CreativeWork structured data, `sitemap.xml`, and `robots.txt` that allows search and AI crawlers (GPTBot, ClaudeBot, PerplexityBot and others) while blocking `/admin`, `/api` and private client links.

## Portfolio admin (`/admin/portfolio`)

Add, edit, reorder (up/down), feature, schedule (future publish date), preview drafts on the real site, and move to trash (restorable). Each project has story, up to six real results, services, technologies, live and video links, testimonial, SEO title and description, and an image gallery with cover and captions. Uploads accept JPEG, PNG and WebP only; every file is re-encoded to WebP (max 2000 px) with a thumbnail and stored in the database, which strips metadata and guarantees it is an image. SVG and anything else is refused. Roles: Super Admin and Editor manage the portfolio; Super Admin and Sales handle billing.

Only publish work you have permission to show. The site never invents clients, results or testimonials: with no projects it shows an honest empty state.

## Billing admin

| Area | Features |
| --- | --- |
| Quotations | GST quotations (CGST+SGST or IGST by place of supply), per-line GST and HSN/SAC, discount, extra charges, amount in words, valid-until with automatic expiry, PDF, email, WhatsApp, private client link with view tracking, client accepts online, convert to invoice (safe to repeat), history |
| Invoices | Tax invoices with UPI QR and bank details, drafts, advance on create, partial payments, overdue status, cancel (only when nothing is paid), PAID stamp, payment history |
| Clients, Leads | Saved customers with GSTIN; website enquiries (quote, demo, call) and one-click create quotation |
| Billing settings | Companies, multiple bank accounts, UPI, logo, signature, stamp, default terms, bank-change history and alert emails |

## Security notes

- Passwords hashed with bcrypt; 5 failed logins lock an account for 15 minutes; generic error text.
- HttpOnly, SameSite=Lax session cookie (8 hours); `AUTH_SECRET` is required (no fallback). Deactivating a user ends their session immediately.
- `proxy.ts` blocks signed-out access to `/admin` and `/api/admin` and cross-site POSTs; every route checks the role again.
- Public endpoints are rate limited; the enquiry form has a honeypot. Put Cloudflare in front (the app trusts `CF-Connecting-IP`).
- Client share links are random 32-character tokens, `noindex`, and an admin preview does not count as a view.
- Bank and UPI changes are audited and emailed to every Super Admin; account numbers are masked.
- Portfolio text is escaped on output; links must be http(s); videos only from YouTube (no-cookie), Vimeo or an https `.mp4`.

## Deploy on Render (PostgreSQL)

Step-by-step guide, including creating the Render Postgres: [docs/RENDER_DEPLOY.md](docs/RENDER_DEPLOY.md). In short: build command `npm install --include=dev && npm run db:push && npm run build`, start command `npm run seed && npm start`, and the environment variables listed in the guide. Free Render instances sleep and free Postgres expires after 30 days, so use paid plans for the real site. A free instance is kept awake by a built-in scheduler (`src/lib/scheduler.ts`) that pings the app's own `APP_URL` every 10 minutes; set `KEEP_AWAKE=false` on a paid always-on instance.

## Deploy on Hostinger (MySQL)

2. In hPanel create the database and user. Set `DATABASE_URL="mysql://USER:PASSWORD@127.0.0.1:3306/DBNAME"` (use 127.0.0.1) and the other variables from `.env.example` as Node.js environment variables. `APP_URL` must be the public site URL.
3. With the MySQL `DATABASE_URL` set, run `npm install`, `npm run db:push`, `npm run build` and `npm run seed` (the scripts pick the MySQL schema automatically).
4. Daily job so Expired and Overdue stay current: `curl -X POST https://YOURDOMAIN/api/cron/refresh-statuses -H "Authorization: Bearer $CRON_SECRET"`.
5. Back up the database and the upload folder daily (see the master plan, section 8).

## Before launch

- Fill the `[placeholders]` in `src/content/legal.ts` (or the live legal pages) and have a lawyer review them.
- Replace the starter company in Billing settings; set `NEXT_PUBLIC_WHATSAPP_NUMBER` and `NEXT_PUBLIC_CONTACT_EMAIL`.
- Add real projects in the portfolio admin, with permission.
- If you add analytics or advertising tags, add a consent banner first and update the Cookie Policy.
