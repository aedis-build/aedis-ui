import { SITE } from "@/content/share";

/**
 * Our own robots.txt: every crawler, AI crawlers included, may read the whole site, and the content signals say
 * what the content may be used for (contentsignals.org; the maintainer's decision of 2026-10-23: search, AI input
 * and AI training all yes, since the project is open source and wants to be known).
 */
export function robotsTxt() {
  return [
    `# ${SITE.name}. Docs for coding agents and assistants: ${SITE.origin}/llms.txt (index) and ${SITE.origin}/llms-full.txt (everything).`,
    "User-agent: *",
    "Content-Signal: search=yes, ai-input=yes, ai-train=yes",
    "Allow: /",
    "",
    `Sitemap: ${SITE.origin}/sitemap.xml`,
    "",
  ].join("\n");
}
