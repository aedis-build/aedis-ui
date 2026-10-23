import { jsonLd } from "@/content/share";

/**
 * The page's schema.org data as a JSON-LD data block. It is text, never run, so the CSP does not apply to it, and
 * React escapes "</script" inside it.
 */
export function JsonLd({ path }: { path: string }) {
  return <script type="application/ld+json">{JSON.stringify(jsonLd(path))}</script>;
}
