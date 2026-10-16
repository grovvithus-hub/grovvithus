import { revalidatePath } from "next/cache";

/** Refreshes the cached public pages after portfolio content changes. */
export const refreshPublicPortfolio = () => {
  revalidatePath("/portfolio", "layout");
  // Service pages are pre-built and list related work, so refresh each dynamic page too.
  revalidatePath("/services");
  // The page file lives in the (site) route group, and the pattern must name it.
  revalidatePath("/(site)/services/[slug]", "page");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
};
