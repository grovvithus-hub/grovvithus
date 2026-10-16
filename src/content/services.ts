import type { PricingModelKey } from "./site";

export type GroupId = "build" | "market" | "maintain" | "create" | "brand" | "advise";

export interface ServiceGroup {
  id: GroupId;
  name: string;
  verb: string;
  benefit: string;
  color: string; // block colour in the 3D growth stack
}

export const SERVICE_GROUPS: ServiceGroup[] = [
  { id: "build", name: "Build", verb: "We build it", benefit: "Websites, stores, software and apps that work on every screen.", color: "#14705A" },
  { id: "market", name: "Market", verb: "We get it found", benefit: "Search, answer-engine and ad work that brings the right visitors.", color: "#B6F23A" },
  { id: "maintain", name: "Maintain", verb: "We keep it running", benefit: "Updates, backups, hosting and monitoring so nothing breaks quietly.", color: "#0F8F6F" },
  { id: "create", name: "Create", verb: "We make the content", benefit: "Videos, posters, social creatives and writing in one consistent style.", color: "#8BD33A" },
  { id: "brand", name: "Brand", verb: "We shape the name", benefit: "Logos, identity and launch campaigns people remember.", color: "#1C8A6E" },
  { id: "advise", name: "Advise", verb: "We show the way", benefit: "Clear audits and advice before you spend on the wrong thing.", color: "#D4F78A" },
];

export interface Service {
  slug: string;
  name: string;
  group: GroupId;
  icon: string; // lucide icon name, resolved in the UI
  tagline: string;
  /** The first 40 to 60 words of the page: a plain answer, also written for answer engines. */
  answer: string;
  deliverables: string[];
  process: { title: string; text: string }[];
  pricingModel: PricingModelKey;
  tools: string[];
  faqs: { q: string; a: string }[];
  related: string[];
}

const std = (a: string, b: string, c: string, d: string) => [
  { title: "Understand", text: a },
  { title: "Plan", text: b },
  { title: "Do the work", text: c },
  { title: "Hand over", text: d },
];

export const SERVICES: Service[] = [
  {
    slug: "web-development",
    name: "Web development",
    group: "build",
    icon: "Globe",
    tagline: "Fast, secure websites that turn visitors into enquiries.",
    answer:
      "Web development is designing and building a website that loads fast, works on every phone and helps visitors take the next step. We build business, portfolio and landing sites with Next.js and React, tested for speed, accessibility and search before launch, and hand over an admin panel so you can edit it yourself.",
    deliverables: ["Sitemap and wireframes", "Custom design in Figma", "Responsive build on Next.js and React", "Contact forms, WhatsApp and analytics set-up", "Speed, security and SEO checks", "30 days of free fixes after launch"],
    process: std(
      "A discovery call about your goals, customers and competitors.",
      "A sitemap and wireframes, then a design you approve in Figma.",
      "We build in small steps and show progress every week, with two revision rounds.",
      "Testing, launch, a walkthrough and 30 days of support.",
    ),
    pricingModel: "fixed",
    tools: ["Next.js", "React", "TypeScript", "Figma", "Cloudflare", "Google Analytics 4"],
    faqs: [
      { q: "How long does a business website take?", a: "Most business websites take three to six weeks from approved design to launch. The exact time depends on the number of pages, features and how quickly content and feedback arrive." },
      { q: "Can I edit the website myself?", a: "Yes. We build an admin area or connect a simple editor, so you can change text, images and projects without a developer." },
      { q: "Will my website show up on Google?", a: "We build it search-friendly from day one: clean structure, fast loading, correct tags and a sitemap. Rankings also depend on content and competition, so we cannot promise a position, but we give you the strongest foundation." },
    ],
    related: ["seo", "application-maintenance", "logo-brand-identity"],
  },
  {
    slug: "wordpress",
    name: "WordPress",
    group: "build",
    icon: "LayoutTemplate",
    tagline: "WordPress sites that are easy to edit and hard to break.",
    answer:
      "WordPress development means building or improving a website on the most widely used website platform so that your team can edit pages without code. We set up a clean theme, the right plugins, speed and security settings, and train you to manage content with confidence.",
    deliverables: ["Theme set-up and customisation", "Elementor or Gutenberg page building", "Essential plugins, configured and licensed", "Speed and security hardening", "Backups and update plan", "A short training session"],
    process: std(
      "We review your content, goals and any existing site.",
      "We pick a lean theme and plugin list, and design the key pages.",
      "We build, connect forms and analytics, and tune speed and security.",
      "We train your team and set up backups and updates.",
    ),
    pricingModel: "fixed",
    tools: ["WordPress", "Elementor", "Gutenberg", "WooCommerce", "Cloudflare", "Search Console"],
    faqs: [
      { q: "Is WordPress right for my business?", a: "It suits content-heavy sites, blogs and small business sites where your team wants to edit pages. For custom apps or heavy interactivity, we may suggest a different approach." },
      { q: "Do you fix hacked or slow WordPress sites?", a: "Yes. We clean, restore and harden compromised sites, and we tune slow ones by checking plugins, images, hosting and caching." },
      { q: "Who owns the site and the plugins?", a: "You own your site and content. We use licensed plugins and tell you clearly which ones need renewals." },
    ],
    related: ["application-maintenance", "seo", "web-development"],
  },
  {
    slug: "shopify",
    name: "Shopify",
    group: "build",
    icon: "ShoppingBag",
    tagline: "Online stores that are set up to sell from day one.",
    answer:
      "Shopify development is setting up an online store with products, payments, shipping and a theme that suits your brand. We configure the store, upload your first products, connect payment and delivery, and set up tracking so you can see what is selling from the first week.",
    deliverables: ["Store set-up and theme customisation", "Product, collection and tax set-up", "Payment and shipping configuration", "Essential apps, configured", "Tracking and Google Merchant basics", "Handover and training"],
    process: std(
      "We learn what you sell, to whom and how you ship.",
      "We plan collections, navigation and the buying journey.",
      "We build the store, add products, test checkout and connect tracking.",
      "We train you to manage products and orders, then launch.",
    ),
    pricingModel: "fixed",
    tools: ["Shopify", "Payment gateways", "Google Merchant Center", "Meta Pixel", "Google Analytics 4"],
    faqs: [
      { q: "Shopify or WooCommerce?", a: "Shopify is quicker to run and maintain, with a monthly platform fee. WooCommerce has no platform fee but needs more upkeep. We recommend based on your products, budget and team." },
      { q: "Can you move my store from another platform?", a: "Yes. We migrate products, customers and key pages, and set up redirects so you keep your search visibility." },
      { q: "Can you also run the ads?", a: "Yes. Our digital marketing service can plan and manage Google and Meta ads for your store." },
    ],
    related: ["digital-marketing", "seo", "posters-and-creatives"],
  },
  {
    slug: "custom-software",
    name: "Custom software",
    group: "build",
    icon: "Code2",
    tagline: "Dashboards, CRMs and systems built around how you work.",
    answer:
      "Custom software is a tool built specifically for your business process, such as a CRM, booking system, dashboard or internal portal. We start with a paid discovery workshop, agree the scope in milestones, and deliver working software every two weeks so you can see and test progress early.",
    deliverables: ["Requirement document and user flows", "UI design", "Working software in two-week sprints", "Automated tests and security checks", "Deployment and documentation", "Source code handover after final payment"],
    process: std(
      "A discovery workshop to map your process and the real problem.",
      "A milestone plan with screens, data and integrations agreed in writing.",
      "Two-week sprints with a demo at the end of each, and your feedback in between.",
      "User testing, go-live, source code handover and 60 days of support.",
    ),
    pricingModel: "milestone",
    tools: ["Next.js", "Node.js", "PostgreSQL", "MySQL", "Docker", "GitHub"],
    faqs: [
      { q: "Why is there a paid discovery step?", a: "Discovery turns an idea into a clear scope. It protects you from building the wrong thing and gives both sides an honest estimate." },
      { q: "Do I get the source code?", a: "Yes. After final payment you receive the source code and documentation for what we built for you." },
      { q: "Can you connect it to our existing tools?", a: "Usually yes. We integrate with payment gateways, WhatsApp, email, accounting tools and other systems that offer an API." },
    ],
    related: ["app-development", "application-maintenance", "consulting-and-audits"],
  },
  {
    slug: "app-development",
    name: "App development",
    group: "build",
    icon: "Smartphone",
    tagline: "Android and iOS apps from one codebase.",
    answer:
      "App development is designing and building a mobile app people actually use. We build Android and iOS apps from a single codebase with React Native or Flutter, which keeps cost and maintenance lower, and we take care of testing, store listing and release.",
    deliverables: ["App flow and UI design", "Android and iOS build", "Backend and API where needed", "Testing on real devices", "Play Store and App Store submission", "Post-launch support plan"],
    process: std(
      "We define who the app is for and the one thing it must do well.",
      "We design the key screens and agree milestones.",
      "We build and release test versions you can install and try.",
      "We submit to the stores, launch and plan updates.",
    ),
    pricingModel: "milestone",
    tools: ["React Native", "Flutter", "TypeScript", "Figma", "Node.js"],
    faqs: [
      { q: "React Native or Flutter?", a: "Both build for Android and iOS from one codebase. We choose based on your team, the features you need and future plans, and explain the reason." },
      { q: "Will the app be approved by the stores?", a: "We follow the store guidelines and prepare the listing carefully. Final approval is the store's decision, so we plan time for review." },
      { q: "Can it work offline?", a: "Yes, where it makes sense. We design what must work offline and what can wait for a connection." },
    ],
    related: ["custom-software", "application-maintenance", "logo-brand-identity"],
  },
  {
    slug: "digital-marketing",
    name: "Digital marketing",
    group: "market",
    icon: "Megaphone",
    tagline: "Ads, email and social media that bring real enquiries.",
    answer:
      "Digital marketing is the planned use of ads, email, WhatsApp and social media to reach people who may want what you sell. We build a monthly plan, run Google and Meta campaigns, publish consistently, and send a clear report on leads and cost per lead each month.",
    deliverables: ["Monthly marketing plan and content calendar", "Google Ads and Meta Ads campaigns", "Social media posts and community replies", "Email and WhatsApp campaigns", "Conversion and call tracking", "A monthly report with plain-English advice"],
    process: std(
      "We study your customers, offers and what competitors do.",
      "We plan channels, budget and a content calendar together.",
      "We run campaigns, publish, test and improve every week.",
      "We report each month on leads and cost per lead, and adjust the plan.",
    ),
    pricingModel: "retainer",
    tools: ["Google Ads", "Meta Ads", "Google Analytics 4", "Email marketing", "WhatsApp Business"],
    faqs: [
      { q: "Do you take a cut of the ad spend?", a: "No. You pay Google and Meta directly. We charge a separate management fee, so you always see exactly where the money goes." },
      { q: "How soon will I see results?", a: "Paid ads can bring enquiries within weeks, but they need testing to become efficient. Organic channels take longer. We set targets together and report honestly against them." },
      { q: "Can you guarantee leads?", a: "No honest agency can. We commit to the agreed activities, reporting and continuous improvement, and we show the numbers every month." },
    ],
    related: ["seo", "posters-and-creatives", "video-editing"],
  },
  {
    slug: "seo",
    name: "SEO",
    group: "market",
    icon: "Search",
    tagline: "Be found on Google by people ready to buy.",
    answer:
      "SEO, or search engine optimization, is improving your website and content so Google shows it to people searching for what you offer. We audit your site, fix technical issues, write helpful pages, build local presence and report monthly on rankings, traffic and enquiries.",
    deliverables: ["Technical and on-page SEO audit", "Keyword and competitor research", "On-page fixes and structured data", "Helpful content and blog plan", "Google Business Profile and local SEO", "Monthly ranking and traffic report"],
    process: std(
      "A full audit of your site, search presence and competitors.",
      "A prioritised plan: quick fixes first, then content and authority.",
      "Monthly work on fixes, content, links and local listings.",
      "A monthly report and a refreshed plan.",
    ),
    pricingModel: "retainer",
    tools: ["Search Console", "Google Analytics 4", "Google Business Profile", "Ahrefs", "Semrush"],
    faqs: [
      { q: "How long does SEO take?", a: "Small fixes can help within weeks, but meaningful growth usually builds over three to six months. SEO compounds: the longer you do it well, the stronger it gets." },
      { q: "Can you guarantee first-page rankings?", a: "No one can, because search engines decide. We guarantee the agreed work and honest reporting, and we aim for steady, lasting gains." },
      { q: "Is local SEO different?", a: "Yes. Local SEO focuses on Google Maps, reviews, and area pages, and it is often the fastest win for clinics, salons, restaurants and shops." },
    ],
    related: ["aeo", "geo", "web-development"],
  },
  {
    slug: "aeo",
    name: "AEO (Answer Engine Optimization)",
    group: "market",
    icon: "MessageSquareQuote",
    tagline: "Be the direct answer in snippets, voice and AI answers.",
    answer:
      "AEO, or answer engine optimization, is writing and structuring your content so it can be used as the direct answer to a question, in Google featured snippets, voice search and AI summaries. We rewrite key pages to lead with a clear answer, add FAQs and structured data, and track which answers you win.",
    deliverables: ["Question research from real customer questions", "Answer-first rewrites of key pages", "FAQ sections with structured data", "Schema markup for your business and services", "Featured snippet and People-also-ask targeting", "Monthly answer-visibility report"],
    process: std(
      "We collect the questions your customers really ask.",
      "We map each question to a page and plan the answer.",
      "We rewrite, add FAQs and structured data, and test.",
      "We track which answers you win and refine.",
    ),
    pricingModel: "retainer",
    tools: ["Search Console", "Schema.org", "Google Rich Results Test", "Google Analytics 4"],
    faqs: [
      { q: "How is AEO different from SEO?", a: "SEO helps a page rank in a list of results. AEO shapes the content so a search or voice assistant can lift a short, correct answer from it." },
      { q: "Does it work for every business?", a: "It works best where customers ask clear questions, such as local services, healthcare, education, software and finance." },
      { q: "Is it sold on its own?", a: "AEO is usually an add-on to an SEO plan, because both rely on the same strong, fast, well-structured site." },
    ],
    related: ["seo", "geo", "content-writing"],
  },
  {
    slug: "geo",
    name: "GEO (Generative Engine Optimization)",
    group: "market",
    icon: "Sparkles",
    tagline: "Get mentioned by ChatGPT, Gemini, Perplexity and Claude.",
    answer:
      "GEO, or generative engine optimization, is making your brand easy for AI assistants such as ChatGPT, Gemini, Perplexity and Claude to find, understand and mention. We strengthen your brand facts, publish original quotable content, earn mentions on trusted sites, and measure how often AI answers include you.",
    deliverables: ["AI visibility audit across major assistants", "Brand and entity clean-up across the web", "Original, quotable content such as guides and comparisons", "Crawler access and structured data review", "Mentions and reviews on trusted third-party sites", "Monthly AI-answer tracking report"],
    process: std(
      "We ask AI assistants the questions your customers ask, and record the answers.",
      "We fix gaps in how your brand is described across the web.",
      "We publish useful, source-worthy content and earn trusted mentions.",
      "We re-test every month and report what changed.",
    ),
    pricingModel: "retainer",
    tools: ["ChatGPT", "Gemini", "Perplexity", "Claude", "Schema.org", "Search Console"],
    faqs: [
      { q: "Can anyone guarantee a mention in AI answers?", a: "No. AI systems change often and decide on their own. We improve the signals you control and measure the results, without making guarantees." },
      { q: "Is GEO a replacement for SEO?", a: "No, it builds on it. A fast, clear, trusted website with strong content helps both search results and AI answers." },
      { q: "Do you need access to my accounts?", a: "Only to your website, analytics and listings. We never need your AI assistant accounts." },
    ],
    related: ["seo", "aeo", "brand-promotion"],
  },
  {
    slug: "application-maintenance",
    name: "Application maintenance",
    group: "maintain",
    icon: "ShieldCheck",
    tagline: "Updates, backups and monitoring so nothing breaks quietly.",
    answer:
      "Application maintenance is the ongoing care of a website or app after launch: security updates, backups, uptime monitoring, bug fixes and small improvements. We offer monthly plans with a clear response time, so problems are found and fixed before your customers notice.",
    deliverables: ["Software and security updates", "Daily backups with tested restores", "Uptime and error monitoring", "Bug fixes within the plan hours", "Performance checks", "A monthly maintenance report"],
    process: std(
      "We review your site or app, hosting and current risks.",
      "We set up backups, monitoring and an update routine.",
      "We update, monitor and fix issues each month.",
      "We send a monthly report and plan improvements.",
    ),
    pricingModel: "retainer",
    tools: ["UptimeRobot", "Sentry", "Cloudflare", "GitHub", "Hostinger", "WordPress"],
    faqs: [
      { q: "What is included in a maintenance plan?", a: "Updates, backups, monitoring and a set number of change hours each month, depending on the plan. Basic, Standard and Premium plans differ in hours and response time." },
      { q: "Do you maintain sites you did not build?", a: "Yes, after a short audit so we know what we are taking on." },
      { q: "What happens if my site goes down?", a: "Monitoring alerts us, we investigate straight away and restore from a backup if needed. Response times depend on your plan." },
    ],
    related: ["web-development", "wordpress", "domain-and-hosting-setup"],
  },
  {
    slug: "domain-and-hosting-setup",
    name: "Domain and hosting setup",
    group: "maintain",
    icon: "Server",
    tagline: "Domain, hosting, email and SSL set up correctly.",
    answer:
      "Domain and hosting setup means registering your web address, choosing suitable hosting, connecting professional email and securing the site with SSL. We do it in your name, configure DNS, email and backups properly, and migrate an existing site without losing search visibility.",
    deliverables: ["Domain registration in your name", "Hosting set-up and configuration", "Business email with SPF, DKIM and DMARC", "SSL and security settings", "Site migration with redirects", "Documented logins handed to you"],
    process: std(
      "We check what you already own and what you need.",
      "We choose the plan and register everything in your name.",
      "We configure DNS, email, SSL and backups, and migrate content if needed.",
      "We test and hand over all accounts and documentation.",
    ),
    pricingModel: "fixed",
    tools: ["Hostinger", "Cloudflare", "DNS", "Business email"],
    faqs: [
      { q: "Will I own my domain?", a: "Yes. We register it in your name and give you the logins. You should always be the owner." },
      { q: "Can you move my website to a new host?", a: "Yes. We copy the site, test it, switch DNS carefully and set up redirects to protect your search rankings." },
      { q: "Do domain and hosting costs come with the service fee?", a: "No. Domain, hosting and email are paid to the provider at actual cost. Our fee covers the set-up work." },
    ],
    related: ["application-maintenance", "web-development", "wordpress"],
  },
  {
    slug: "video-editing",
    name: "Video editing",
    group: "create",
    icon: "Clapperboard",
    tagline: "Reels, YouTube and ad videos that keep people watching.",
    answer:
      "Video editing is turning raw footage into a clear, engaging video for social media, YouTube, ads or your website. We cut, add captions, music and motion graphics, and deliver the right formats for each platform, with two revision rounds included.",
    deliverables: ["Cutting and pacing", "Captions and subtitles", "Music and sound clean-up", "Motion graphics and titles", "Exports for Reels, Shorts, YouTube and ads", "Source project files on request"],
    process: std(
      "You share footage and tell us the goal and platform.",
      "We agree the style, length and examples you like.",
      "We edit a first cut and refine it with your feedback.",
      "We deliver final files in every format you need.",
    ),
    pricingModel: "per-item",
    tools: ["CapCut", "Adobe video tools", "Motion graphics", "Captions and subtitles"],
    faqs: [
      { q: "How fast can you deliver a reel?", a: "Short reels usually take 24 to 48 hours once we have the footage and brief. Longer videos take longer, and we agree the date upfront." },
      { q: "Do you shoot the videos too?", a: "Our core service is editing. If you need shooting, tell us and we will plan it as a separate item." },
      { q: "Can I get a monthly pack?", a: "Yes. A monthly pack of reels or videos works well for regular posting and costs less per video." },
    ],
    related: ["posters-and-creatives", "digital-marketing", "brand-promotion"],
  },
  {
    slug: "posters-and-creatives",
    name: "Posters and creatives",
    group: "create",
    icon: "Image",
    tagline: "Posters, social posts and banners in one consistent style.",
    answer:
      "Posters and creatives are the designs you post and print: social media posts, banners, posters, brochures and packaging. We design them in your brand style so every piece looks like it comes from one company, and deliver ready-to-post files in the right sizes.",
    deliverables: ["Posters and social media posts", "Banners and ad creatives", "Brochures and flyers", "Packaging and label designs", "Templates your team can reuse", "Print-ready and web-ready files"],
    process: std(
      "You share your brand and the message for each piece.",
      "We propose a layout and style for the first design.",
      "We design, refine with your feedback and extend to the full set.",
      "We deliver all sizes and editable files.",
    ),
    pricingModel: "per-item",
    tools: ["Figma", "Adobe design tools", "Canva", "Blender"],
    faqs: [
      { q: "Can you design a full month of posts?", a: "Yes. Monthly packs are our most popular option, with a content calendar so posting stays consistent." },
      { q: "Do I get the editable files?", a: "Yes, on request and after full payment, so your team can reuse the designs." },
      { q: "Can you match my existing brand?", a: "Yes. Send your logo and any brand guide. If you have none, our logo and brand identity service can create one." },
    ],
    related: ["logo-brand-identity", "digital-marketing", "video-editing"],
  },
  {
    slug: "content-writing",
    name: "Content writing",
    group: "create",
    icon: "PenLine",
    tagline: "Clear words for websites, blogs, products and scripts.",
    answer:
      "Content writing is producing clear, useful text for your website, blog, product pages, emails and video scripts. We write in plain English, research your topic, structure it for readers and search engines, and match your brand voice, with one revision round included.",
    deliverables: ["Website and landing page copy", "Blog articles and guides", "Product descriptions", "Video and reel scripts", "FAQ sections written for answer engines", "Editing and proofreading"],
    process: std(
      "You share your audience, goal and examples of your voice.",
      "We research and propose an outline.",
      "We write, edit and fact-check.",
      "We deliver, revise once and publish if you like.",
    ),
    pricingModel: "per-item",
    tools: ["Google Docs", "Search Console", "WordPress", "Plain-English editing"],
    faqs: [
      { q: "Do you write in other languages?", a: "We start with English. Telugu and Hindi can be added for suitable projects, so ask us about your need." },
      { q: "Is the content original?", a: "Yes. We write original text and check sources. We do not copy from other sites." },
      { q: "Can you write about technical topics?", a: "Yes. We interview you or your team, read your material and turn it into clear text for your customers." },
    ],
    related: ["seo", "aeo", "digital-marketing"],
  },
  {
    slug: "logo-brand-identity",
    name: "Logo and brand identity",
    group: "brand",
    icon: "Palette",
    tagline: "A logo and brand system that looks like you mean it.",
    answer:
      "Logo and brand identity design creates the visual core of your business: a logo, colours, fonts and simple rules for using them. We explore directions, refine your favourite, and deliver a brand guide with every file you need for web, print and social media.",
    deliverables: ["Brand questions and research", "Logo concepts and refinement", "Colour palette and fonts", "Logo files for web and print", "A short brand guide", "Social media profile kit"],
    process: std(
      "A short brief about your business, customers and taste.",
      "Two or three directions, shown as real examples.",
      "We refine your chosen direction with your feedback.",
      "We deliver all files and the brand guide.",
    ),
    pricingModel: "fixed",
    tools: ["Figma", "Adobe design tools", "Blender"],
    faqs: [
      { q: "How many logo concepts will I see?", a: "Usually two or three distinct directions, then refinement of the one you choose, with revision rounds included." },
      { q: "Do I own the logo?", a: "Yes. After full payment you own the final logo and files." },
      { q: "Can you also create a 3D version?", a: "Yes. We build 3D marks in Blender for websites and videos, as we did for our own logo." },
    ],
    related: ["posters-and-creatives", "web-development", "brand-promotion"],
  },
  {
    slug: "brand-promotion",
    name: "Brand promotion",
    group: "brand",
    icon: "Rocket",
    tagline: "Launch campaigns and outreach that build real awareness.",
    answer:
      "Brand promotion is planned activity that makes the right people aware of your business and trust it: launch campaigns, creator and influencer outreach, press and community work. We build a clear plan, run it, and report what reached whom, with honest numbers.",
    deliverables: ["Brand positioning and message", "Launch campaign plan", "Influencer and creator outreach", "Press and community outreach", "Campaign creatives and content", "Campaign report"],
    process: std(
      "We clarify what you stand for and who needs to hear it.",
      "We plan the campaign, channels and timeline.",
      "We run it, with content, outreach and ads working together.",
      "We report reach and results, and plan the next step.",
    ),
    pricingModel: "retainer",
    tools: ["Meta Ads", "Social media", "Creator outreach", "Google Analytics 4"],
    faqs: [
      { q: "Is this only for new brands?", a: "No. It also helps established brands that want to reach a new audience or launch a new product." },
      { q: "Do you buy followers or fake reviews?", a: "Never. We only use honest methods, which protects your brand and follows platform rules." },
      { q: "Can it be a one-time project?", a: "Yes. A launch can be a one-time project, and many clients then continue with a monthly plan." },
    ],
    related: ["digital-marketing", "logo-brand-identity", "video-editing"],
  },
  {
    slug: "consulting-and-audits",
    name: "Consulting and audits",
    group: "advise",
    icon: "ClipboardCheck",
    tagline: "A clear written report before you spend on the wrong thing.",
    answer:
      "A consulting audit is an independent review of your website, search presence, security or user experience, with a written report of what to fix first. It gives you a prioritised plan you can use with us or with any other team, for a fixed fee.",
    deliverables: ["Website, SEO, security or UX audit", "Prioritised list of issues", "Quick wins and longer plans", "A written report", "A walkthrough call", "Optional follow-up support"],
    process: std(
      "You tell us what worries you and give access.",
      "We review the site, data and competitors.",
      "We write the report with clear priorities.",
      "We walk you through it and answer questions.",
    ),
    pricingModel: "time-material",
    tools: ["Lighthouse", "Search Console", "Google Analytics 4", "Security checklists"],
    faqs: [
      { q: "Do I have to hire you after the audit?", a: "No. The report is yours to use with any team. We are happy to help if you ask." },
      { q: "How long does an audit take?", a: "Most audits take three to seven working days, depending on the size of the site." },
      { q: "What do you need from me?", a: "Access to your website, analytics and search tools where relevant, and a short chat about your goals." },
    ],
    related: ["seo", "custom-software", "application-maintenance"],
  },
];

export const getService = (slug: string) => SERVICES.find((s) => s.slug === slug);
export const servicesInGroup = (id: GroupId) => SERVICES.filter((s) => s.group === id);
export const groupOf = (s: Service) => SERVICE_GROUPS.find((g) => g.id === s.group)!;
