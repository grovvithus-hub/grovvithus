import type { Metadata } from "next";

// Client links are private: keep them out of search engines and previews.
export const metadata: Metadata = {
  title: "Your document",
  robots: { index: false, follow: false, nocache: true },
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
