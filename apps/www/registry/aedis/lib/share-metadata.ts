import type { Metadata } from "next";

import { allowedOrigins, safeUrl, stripInvisible } from "@/lib/untrusted";

export type ShareMetadataOptions = {
  /** The site: its https origin ("https://ui.aedis.build") and its name. */
  site: { origin: string; name: string };
  /** The page's canonical URL: absolute, https, on the site's origin. */
  url: string;
  title: string;
  description: string;
  /** The share card: absolute, https, on the site's origin; 1200×630 unless said otherwise. The alt text is required. */
  image: { url: string; alt: string; width?: number; height?: number };
  /** "article" for docs and posts; "website" by default. */
  type?: "website" | "article";
};

/** An absolute https URL on `origin`, through safeUrl; anything else throws, so the build fails instead of shipping it. */
function ownUrl(value: string, origin: string, what: string): string {
  const url = safeUrl(value);
  let parsed: URL | null = null;
  try {
    parsed = url ? new URL(url) : null;
  } catch {
    // relative: refused below
  }
  if (!parsed || parsed.protocol !== "https:" || parsed.origin !== origin) {
    throw new Error(`shareMetadata: ${what} must be an absolute https URL on ${origin}`);
  }
  return parsed.href;
}

const text = (value: string) => stripInvisible(value).replace(/\s+/g, " ").trim();

/**
 * Everything a link preview reads, for a page's Next `metadata`: Open Graph (title, description, image with its size
 * and alt, canonical URL, site name, type) and the Twitter large-image card, plus the canonical link. One call per
 * page, so no page can forget a tag.
 */
export function shareMetadata({ site, url, title, description, image, type = "website" }: ShareMetadataOptions): Metadata {
  const [origin] = allowedOrigins([site.origin]);
  if (!origin?.startsWith("https://")) throw new Error("shareMetadata: site.origin must be an https origin");
  const canonical = ownUrl(url, origin, "url");
  const card = { url: ownUrl(image.url, origin, "image.url"), width: image.width ?? 1200, height: image.height ?? 630, alt: text(image.alt) };
  if (!card.alt) throw new Error("shareMetadata: image.alt is required");
  const [t, d] = [text(title), text(description)];
  return {
    title: t,
    description: d,
    alternates: { canonical },
    openGraph: { type, url: canonical, siteName: text(site.name), title: t, description: d, images: [card] },
    twitter: { card: "summary_large_image", title: t, description: d, images: [{ url: card.url, alt: card.alt }] },
  };
}
