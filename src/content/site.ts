// Shared copy for the public website. Keep claims honest: no prices, no guaranteed results,
// no client names or numbers that do not exist yet (portfolio items come from the admin panel).

export const SITE = {
  name: "GrovvIthUs",
  tagline: "Build. Market. Scale.",
  headline: "Grow with us.",
  promise: "One team to build, market and scale your brand online. We build it, market it, and keep it running.",
  url: (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^0-9]/g, ""),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
};

export type PricingModelKey = "fixed" | "milestone" | "retainer" | "per-item" | "time-material" | "management-fee";

export const PRICING_MODELS: { key: PricingModelKey; name: string; short: string; how: string; for: string; quote: string }[] = [
  {
    key: "fixed",
    name: "Fixed package",
    short: "One clear scope for one clear outcome.",
    how: "We agree the pages, features and deliverables up front. You get one quotation for the whole scope, plus optional add-ons.",
    for: "Websites, logos, Shopify stores, WordPress sites",
    quote: "Package base plus any add-ons such as extra pages or integrations.",
  },
  {
    key: "milestone",
    name: "Milestones",
    short: "Big builds, approved step by step.",
    how: "We split the project into milestones. Each one is demonstrated and approved before the next starts, so there are no surprises.",
    for: "Custom software, web apps, mobile apps",
    quote: "Effort per feature and milestone, with a small allowance for the unknown.",
  },
  {
    key: "retainer",
    name: "Monthly retainer",
    short: "Steady work that keeps growing.",
    how: "A fixed monthly fee for an agreed list of activities, with a report every month. Cancel with notice.",
    for: "SEO, marketing, social media, maintenance",
    quote: "A plan tier, plus extra hours if you need them.",
  },
  {
    key: "per-item",
    name: "Per item",
    short: "Pay for what you need.",
    how: "A unit price per video, design or article, or a monthly pack. Volume discounts apply to larger batches.",
    for: "Video editing, posters, social creatives, content writing",
    quote: "Unit price times quantity, with a volume discount.",
  },
  {
    key: "time-material",
    name: "Time and material",
    short: "Flexible when the scope is still forming.",
    how: "You pay for the time spent, with an agreed cap so the budget never runs away.",
    for: "Consulting, audits, changes and small tasks",
    quote: "Hours estimated and capped, at an agreed rate.",
  },
  {
    key: "management-fee",
    name: "Management fee",
    short: "We run the ads, you pay the platform.",
    how: "A management fee for planning, running and improving paid campaigns. Ad spend is paid by you directly to Google or Meta.",
    for: "Google Ads and Meta Ads",
    quote: "A fee tier based on monthly ad spend.",
  },
];

export const PROCESS = [
  { title: "Discovery", text: "A short call to understand your goals, customers and what you already have. No jargon, no pressure." },
  { title: "Quote", text: "You receive a personal quotation that explains what is included, the pricing model and the timeline." },
  { title: "Design", text: "We design the look and flow first, in Figma, and you approve it before any code is written." },
  { title: "Build", text: "We build in small steps and show progress often, so you always see where the project stands." },
  { title: "Launch", text: "Testing, speed and security checks, search set-up, and a calm go-live with a handover." },
  { title: "Grow", text: "Maintenance, marketing and monthly reports keep the result growing after launch." },
];

export const SKILL_GROUPS = [
  {
    name: "Engineering",
    blurb: "Fast, secure sites and software that are easy to maintain.",
    skills: ["Next.js", "React", "TypeScript", "Node.js", "WordPress", "Shopify", "React Native", "Flutter", "MySQL", "PostgreSQL", "REST APIs", "Docker", "GitHub"],
  },
  {
    name: "Marketing and search",
    blurb: "Visibility in Google, in answer boxes and in AI assistants.",
    skills: ["SEO", "AEO", "GEO", "Local SEO", "Google Ads", "Meta Ads", "Google Analytics 4", "Search Console", "Email and WhatsApp", "Content strategy"],
  },
  {
    name: "Creative",
    blurb: "Brand and media work that looks like one team made it.",
    skills: ["Logo design", "Brand identity", "Figma", "Posters and social creatives", "Video editing", "Motion graphics", "3D with Blender", "Copywriting"],
  },
  {
    name: "Care",
    blurb: "We stay after launch, so nothing quietly breaks.",
    skills: ["Backups", "Uptime monitoring", "Security updates", "Performance tuning", "Cloudflare", "Hosting set-up", "Monthly reports"],
  },
];

export const VALUES = [
  { title: "The client's growth is our product", text: "We measure ourselves by what happens to your business after launch, not by the number of pages we deliver." },
  { title: "Plain English", text: "Short sentences, no jargon, and a clear explanation of what you are paying for." },
  { title: "Proof before promises", text: "We show work and explain methods. We never guarantee rankings or sales, because nobody honestly can." },
  { title: "One team", text: "Developers, designers, editors and marketers work together, so you manage one relationship instead of five." },
];

export const PORTFOLIO_CATEGORIES = [
  { key: "WEB", label: "Websites" },
  { key: "APP", label: "Apps and software" },
  { key: "LOGO", label: "Logos and brand" },
  { key: "VIDEO", label: "Video" },
  { key: "CREATIVE", label: "Posters and creatives" },
  { key: "MARKETING", label: "Marketing and SEO" },
  { key: "OTHER", label: "Other" },
] as const;

export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number]["key"];

export const categoryLabel = (key: string) => PORTFOLIO_CATEGORIES.find((c) => c.key === key)?.label || "Other";

export const FOOTER_NOTE = "We never publish a price list. We explain how pricing works for your project and send a personal quotation.";
