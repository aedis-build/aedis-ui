import type { Metadata } from "next";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { shareArt, type ShareSection } from "@/components/site/share-art";
import { blocks, blockSecurity } from "@/content/blocks";
import { components, guides, type ComponentDoc } from "@/content/components";
import registry from "@/registry.json";
import { shareMetadata } from "@/registry/aedis/lib/share-metadata";
import type { ThemeName } from "@/registry/aedis/lib/tokens";
import { ShareCard, type ShareCardProps } from "@/registry/aedis/ui/share-card";

export const SITE = { origin: "https://ui.aedis.build", name: "Aedis UI" };
const DOMAIN = "ui.aedis.build";

/** What a page's share card and link preview say. */
export type SharePage = {
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  section: ShareSection;
  chips?: string[];
  theme?: ThemeName;
  type?: "website" | "article";
};

const uiCount = registry.items.filter((i) => i.type === "registry:ui").length;

/** The site's own pages; the docs entries and the blocks are added from their content below. */
const pages: SharePage[] = [
  { path: "/", title: "Secure by default.", description: "Approvals, agent chat, usage and charts you copy into your app, verified before install.", eyebrow: "Components for AI platforms", section: "home", chips: [`${uiCount} components`, "Signed releases"], theme: "dark" },
  { path: "/docs", title: "Introduction", description: "What Aedis UI is and where to start.", eyebrow: "Docs", section: "component" },
  { path: "/components", title: "Components", description: "Every Aedis UI component and hook, live, by category, with the sink it defends.", eyebrow: "Components", section: "component", chips: [`${uiCount} components`] },
  { path: "/blocks", title: "Blocks", description: "Whole screens for AI platforms, built only from Aedis UI components and installed with the CLI.", eyebrow: "Blocks", section: "blocks", chips: [`${blocks.length} blocks`] },
  { path: "/charts", title: "Charts", description: "Charts for usage, spend and agent health. Data in, text out.", eyebrow: "Charts", section: "charts" },
  { path: "/micro-frontends", title: "Micro-frontends", description: "Compose apps from frames, elements and zones without giving up the CSP.", eyebrow: "Micro-frontends", section: "micro-frontends", chips: ["mf-frame", "mf-bridge", "Live demo"] },
  { path: "/security", title: "Security by construction", description: "How Aedis UI treats each class of attack a browser application faces, and what it leaves to the backend.", eyebrow: "Security", section: "security", chips: ["DOM", "Input", "Transport", "Session"] },
  { path: "/directory", title: "Directory", description: "Registries you can add with the Aedis CLI, each checked the same way as Aedis UI.", eyebrow: "Directory", section: "security", chips: ["Signed", "Provenance"] },
  { path: "/themes", title: "Themes", description: "Create your own Aedis UI theme: edit it live, check contrast, export the JSON and import it with the CLI.", eyebrow: "Themes", section: "component" },
  { path: "/typeset", title: "Typeset", description: "Set the type for your product and see it on real content.", eyebrow: "Typeset", section: "component" },
  { path: "/create", title: "Create", description: "Start a project with your theme, your blocks and the security level you need.", eyebrow: "Create", section: "home" },
  { path: "/docs/theming", title: "Theming", description: "The Aedis UI default theme: color, type, depth, material and motion tokens.", eyebrow: "Foundations · Guide", section: "component", type: "article" },
  { path: "/docs/server-actions", title: "Server Actions", description: "Every Server Action is a public POST endpoint. How to keep them safe with secureAction.", eyebrow: "Security · Guide", section: "security", type: "article" },
  { path: "/docs/micro-frontends", title: "Micro-frontends", description: "Choosing between an iframe, a Web Component, Multi-Zones and Module Federation, and running Multi-Zones safely on one site.", eyebrow: "Micro-frontends · Guide", section: "micro-frontends", type: "article" },
];

const kind: Record<string, string> = { "registry:ui": "Component", "registry:lib": "Library", "registry:hook": "Hook", "registry:block": "Block" };
const item = (name: string) => registry.items.find((i) => i.name === name);

/** A docs entry's section art: its own where the site has one, the components' otherwise. */
const sectionOf = (doc: ComponentDoc): ShareSection =>
  doc.category === "Charts" ? "charts" : doc.category === "Micro-frontends" ? "micro-frontends" : doc.category === "Security" || doc.category === "Transport" ? "security" : "component";

/** The chips of a docs entry: the primitive it is built on and the sinks it defends, from the security panel data. */
const docChips = (doc: ComponentDoc) => [
  ...((item(doc.name) as { dependencies?: string[] } | undefined)?.dependencies?.some((d) => d.startsWith("@base-ui/")) ? ["Base UI"] : []),
  ...doc.security.sinks.map((sink) => `${sink} sink`),
];

/** Every page with a share card: the site's pages, each docs entry and each block. Frame-only pages have none. */
export function sharePages(): SharePage[] {
  const written = new Set(pages.map((p) => p.path));
  return [
    ...pages,
    ...components
      .filter((doc) => !written.has(`/docs/${doc.name}`) && !guides.some((g) => g.href === `/docs/${doc.name}`))
      .map((doc): SharePage => ({
        path: `/docs/${doc.name}`,
        title: doc.title,
        description: doc.description,
        eyebrow: `${doc.category} · ${kind[item(doc.name)?.type ?? ""] ?? "Guide"}`,
        section: sectionOf(doc),
        chips: docChips(doc),
        type: "article",
      })),
    ...blocks.map((b): SharePage => ({ path: `/blocks/${b.name}`, title: b.title, description: b.description, eyebrow: `${b.category} · Block`, section: "blocks", chips: blockSecurity(b).security.sinks.map((sink) => `${sink} sink`) })),
  ];
}

/** The site's share card for a page. */
export function shareCard(page: SharePage) {
  const Art = shareArt[page.section];
  const props: ShareCardProps = {
    brand: {
      name: SITE.name,
      logo: (
        <svg width="44" height="44" viewBox="0 0 64 64">
          <polygon points="8,8 56,8 47,58 17,58" fill="#c8a24c" stroke="#0e1626" strokeWidth="3" strokeLinejoin="round" />
          <polygon points="56,8 47,58 40,8" fill="#9c7c2c" />
          <circle cx="32" cy="27" r="6.5" fill="#0e1626" />
          <rect x="29.5" y="29" width="5" height="15" rx="1.5" fill="#0e1626" />
        </svg>
      ),
    },
    eyebrow: page.eyebrow,
    title: page.title,
    description: page.description,
    chips: page.chips,
    domain: DOMAIN,
    art: <Art />,
    theme: page.theme ?? "light",
  };
  return <ShareCard {...props} />;
}

// The card's look changes with these files: they are part of every image's name, so a new look gets new URLs.
let look: string | undefined;
const lookHash = () =>
  (look ??= ["registry/aedis/ui/share-card.tsx", "components/site/share-art.tsx", "content/share.tsx"].map((f) => readFileSync(join(process.cwd(), f), "utf8")).join("\n"));

/**
 * The image's file under /og/: the page's path and a hash of what the card shows and of the card's code, so the
 * file can be cached for good (`_headers`) and a change gets a new URL.
 */
export function shareImageFile(page: SharePage): string {
  const slug = page.path === "/" ? "home" : page.path.slice(1).replaceAll("/", "-");
  const hash = createHash("sha256").update(JSON.stringify(page)).update(lookHash()).digest("hex").slice(0, 12);
  return `${slug}-${hash}.png`;
}

const sharePage = (path: string) => {
  const page = sharePages().find((p) => p.path === path);
  if (!page) throw new Error(`no share card for ${path}`);
  return page;
};

/** `<link rel="alternate" type="text/plain" title="llms.txt">` in every head: where agents find the docs as text. */
export const llmsAlternate = { "text/plain": [{ url: `${SITE.origin}/llms.txt`, title: "llms.txt" }] };

/** The page's metadata: title, description, canonical link and every share tag, with its card as the image. */
export function pageMetadata(path: string): Metadata {
  const page = sharePage(path);
  const metadata = shareMetadata({
    site: SITE,
    url: `${SITE.origin}${path}`,
    title: page.title,
    description: page.description,
    image: { url: `${SITE.origin}/og/${shareImageFile(page)}`, alt: `${page.title} · ${SITE.name}` },
    type: page.type,
  });
  return { ...metadata, alternates: { ...metadata.alternates, types: llmsAlternate } };
}

const REPOSITORY = "https://github.com/aedis-build/aedis-ui";

/**
 * The page's structured data (schema.org JSON-LD): the WebSite on every page, the source code of Aedis UI on the
 * product pages and a TechArticle on the docs pages, all from the same table as the cards.
 */
export function jsonLd(path: string) {
  const page = sharePage(path);
  const url = `${SITE.origin}${path}`;
  const website = { "@type": "WebSite", "@id": `${SITE.origin}/#website`, url: `${SITE.origin}/`, name: SITE.name, inLanguage: "en", publisher: { "@type": "Organization", name: "Aedis", url: "https://aedis.build" } };
  const code = {
    "@type": "SoftwareSourceCode",
    "@id": `${SITE.origin}/#source`,
    name: SITE.name,
    description: "Secure-by-default React components for building AI platforms.",
    url: `${SITE.origin}/`,
    codeRepository: REPOSITORY,
    license: "https://www.apache.org/licenses/LICENSE-2.0",
    programmingLanguage: ["TypeScript", "React"],
    runtimePlatform: "Next.js",
  };
  const image = `${SITE.origin}/og/${shareImageFile(page)}`;
  const own = page.type === "article"
    ? { "@type": "TechArticle", "@id": `${url}#article`, headline: page.title, description: page.description, url, image, inLanguage: "en", isPartOf: { "@id": website["@id"] }, about: { "@id": code["@id"] }, author: website.publisher, publisher: website.publisher }
    : { "@type": "WebPage", "@id": `${url}#webpage`, name: page.title, description: page.description, url, image, isPartOf: { "@id": website["@id"] }, about: { "@id": code["@id"] } };
  return { "@context": "https://schema.org", "@graph": [website, code, own] };
}
