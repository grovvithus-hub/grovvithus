# Deploy GrovvIthUs on Render (with Render Postgres)

This guide takes you from an empty Render account to a live site. You do everything in the Render dashboard; nothing is created for you.

The app detects the database from `DATABASE_URL` and uses PostgreSQL automatically on Render, so there are no code changes to make. It was tested end to end against a real PostgreSQL (156 checks passing).

## What you need first

- The code in your GitHub repo: `https://github.com/grovvithus-hub/grovvithus` (branch `main`).
- A Render account that is connected to GitHub, with access granted to that repository (Render may ask you to install its GitHub app on the `grovvithus-hub` organisation; the organisation owner must approve it).
- Four secrets ready (write them down in a password manager):
  - `AUTH_SECRET`: 48+ random characters. Make one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
  - `CRON_SECRET`: another random value made the same way.
  - `ADMIN_EMAIL`: the email you will sign in with.
  - `ADMIN_PASSWORD`: at least 12 characters.

## Choose your plans (read this first)

Render's own documentation says free instances are for testing and hobby use:

| | Free | What it means for GrovvIthUs |
| --- | --- | --- |
| Web service | Sleeps after 15 minutes without traffic, about one minute to wake; 750 free hours a month per workspace; no persistent disk; no shell | The first visitor after a quiet spell waits about a minute. Fine to test, poor for a real agency site. |
| Postgres | 1 GB, **expires 30 days after creation** (14-day grace, then data is deleted), no backups, one per workspace | Fine to test. **Do not launch on it**: the database, and every portfolio image stored in it, is deleted. |

For the real site choose a paid web service (always on) and a paid Postgres (backups with point-in-time recovery). Check current prices on https://render.com/pricing. Uploaded portfolio images are stored inside the database, so they survive redeploys and are covered by its backups; each image is roughly 100 to 400 KB.

Start on the free plans to test, then change plans in the dashboard before you launch.

## Step 1: Create the Postgres database

1. In Render open **New +** then **Postgres**.
2. **Name:** `grovvithus-db` (any name).
3. **Database** and **User:** leave blank or use `grovvithus` and `grovvithus_user`. You cannot change them later.
4. **Region:** pick the one closest to your visitors. **The web service must use the same region**, and the region cannot be changed later.
5. **PostgreSQL version:** the default is fine (13 to 18 are available).
6. **Plan:** Free to test, or a paid plan for the real site. Storage 1 GB is plenty to start.
7. Click **Create Database** and wait until the status says **Available**.
8. Open the database, go to **Connections**, and copy the **Internal Database URL**. It looks like `postgresql://user:password@dpg-xxxxx-a/grovvithus`. Use the internal URL for the web service (faster and private). Use the external URL only from your own computer, with `?sslmode=require` added.

## Step 2: Create the web service

1. **New +** then **Web Service**, connect GitHub, and select `grovvithus-hub/grovvithus`.
2. Fill in:

| Field | Value |
| --- | --- |
| Name | `grovvithus` (this becomes `grovvithus.onrender.com`) |
| Region | The same region as the database |
| Branch | `main` |
| Runtime / Language | Node |
| Build Command | `npm install --include=dev && npm run db:push && npm run build` |
| Start Command | `npm run seed && npm start` |
| Instance type | Free to test, paid for the real site |
| Health Check Path | `/` |

What these do:

- `npm install --include=dev` also installs the build tools (Tailwind, TypeScript). Without it the build can fail.
- `npm run db:push` sees the PostgreSQL URL, picks the PostgreSQL schema, creates the tables and, on later deploys, applies safe schema changes (it refuses changes that would delete data).
- `npm run build` builds the site.
- `npm run seed` creates the first Super Admin and a starter company **only if the admin does not exist yet**. A redeploy never resets a password you changed.

## Step 3: Environment variables

Add these under **Environment** before the first deploy. Mark secrets as secret.

| Key | Value |
| --- | --- |
| `DATABASE_URL` | The **Internal Database URL** from Step 1 |
| `AUTH_SECRET` | Your random 48+ character secret |
| `ADMIN_EMAIL` | Your sign-in email |
| `ADMIN_PASSWORD` | 12+ characters |
| `CRON_SECRET` | Your second random secret |
| `APP_URL` | `https://grovvithus.onrender.com` (use your real service URL; change it to your domain later) |
| `DISABLE_EMAILS` | `true` until you set up email (below) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Digits with country code, e.g. `919876543210` (optional) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Your public email (optional) |

`NEXT_PUBLIC_` values are built into the site, so after changing them you must redeploy (**Manual Deploy** then **Clear build cache & deploy**).

Optional email (to send quotations and invoices): set `DISABLE_EMAILS` to `false` and add `SMTP_HOST`, `SMTP_PORT` (465), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` and `ADMIN_NOTIFY_EMAIL`. Hostinger business email works for this.

Node 24 is selected by the `.node-version` file in the repo; you do not need to set it.

## Step 4: Deploy and check

1. Click **Create Web Service**. The first build takes a few minutes.
2. In **Logs** look for: `[prisma] postgresql -> prisma/schema.postgres.prisma`, `Your database is now in sync with your Prisma schema`, `Super Admin ready: <your email>`, then the site starting.
3. Open your service URL. The home page should load with the 3D hero.
4. Go to `/admin`, sign in, then open **Billing settings** and complete your company details (legal name, GST state, bank account, UPI, logo).
5. Add a test project in **Portfolio**, upload an image, publish it, and check `/portfolio`.
6. Send a test enquiry from `/contact` and check it appears under **Leads**.
7. Open `/robots.txt` and `/sitemap.xml` to confirm they load.

## Step 5: Your own domain

1. In the service open **Settings**, then **Custom Domains**, and add `www.yourdomain.com` (and the bare domain if you want).
2. Add the DNS records Render shows (a CNAME for `www`; for the bare domain follow Render's instructions). If you use Cloudflare, start with the proxy turned off (DNS only) until the certificate is issued, then turn it on with SSL mode **Full (strict)**.
3. When the domain works, change `APP_URL` to `https://www.yourdomain.com` and redeploy. This keeps client quotation links, the sitemap and the admin security check correct.

## Step 6: Keep Expired and Overdue statuses current

Statuses update whenever someone opens the lists. To update them daily even when nobody does, call this once a day:

```bash
curl -X POST https://YOURDOMAIN/api/cron/refresh-statuses -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Options: a Render Cron Job (check Render's pricing for cron jobs), or a free scheduled GitHub Actions workflow that runs the same `curl` with the two values stored as repository secrets.

## Updating the site later

Push to `main`; Render rebuilds and deploys automatically. The build runs `db:push`, so adding fields applies on deploy. Removing or changing a column in a way that could lose data makes the build stop instead of deleting anything, and you decide what to do.

## Backups

- Paid Render Postgres includes point-in-time recovery and on-demand exports (see the database page in the dashboard).
- You can also export from your computer with the external URL: `pg_dump "EXTERNAL_URL?sslmode=require" > backup.sql`. Keep a copy before every major change.

## Troubleshooting

| Problem | Likely cause and fix |
| --- | --- |
| Build fails with "Cannot find module tailwindcss" or similar | The build command is missing `--include=dev`. Use the command in Step 2. |
| `AUTH_SECRET must be set` | Add `AUTH_SECRET` (32+ characters) in Environment and redeploy. |
| Cannot reach the database | Use the **Internal** URL, and put the database and the web service in the **same region**. |
| Sign-in works but saving anything says "Cross-site request blocked" | `APP_URL` does not match the address you are visiting. Set it to your exact public URL and redeploy. |
| Forgot the admin password | Set `RESET_ADMIN_PASSWORD=true` and a new `ADMIN_PASSWORD`, redeploy once, then remove `RESET_ADMIN_PASSWORD`. |
| Seed says the admin already exists | Expected after the first deploy. It never overwrites a password. |
| WhatsApp button missing | `NEXT_PUBLIC_WHATSAPP_NUMBER` is not set, or the site was not rebuilt after setting it. |
| Emails say "turned off on this server" | `DISABLE_EMAILS` is `true` or the `SMTP_*` values are missing. |
| Site is slow on the first visit after a quiet period | Free web services sleep. Use a paid instance. |
| Database disappeared after about 30 days | A free Render Postgres expires. Use a paid plan for the real site. |
| Portfolio images missing after you moved to a new database | Images live in the database; restore from a backup of that database. |

## Before you announce the site

- Fill the highlighted `[placeholders]` on the legal pages and have a lawyer review them.
- Replace the starter company in Billing settings.
- Add real projects with permission, and real testimonials only.
- Turn on a paid database plan and confirm backups.
