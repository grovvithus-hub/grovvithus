import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";

/**
 * Public pages are open to search engines AND to AI crawlers on purpose (GEO): visibility in
 * ChatGPT, Gemini, Perplexity and Claude depends on being allowed to read the site.
 * The admin panel, APIs and private client links are never crawled.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin", "/api/", "/p/"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "PerplexityBot", "Google-Extended"].map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
