import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingActions } from "@/components/site/FloatingActions";
import { themeInitScript } from "@/components/site/theme-script";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  openGraph: { siteName: SITE.name, type: "website", images: [{ url: "/brand/social-post.png", width: 1080, height: 1350, alt: "GrovvIthUs: Grow with us" }] },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "./" },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site min-h-screen">
      {/* Sets the light or dark theme before first paint, so there is no flash. */}
      <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      <SiteHeader whatsapp={SITE.whatsapp} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
      <FloatingActions whatsapp={SITE.whatsapp} />
    </div>
  );
}
