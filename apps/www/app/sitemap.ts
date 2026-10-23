import type { MetadataRoute } from "next";
import { execFileSync } from "node:child_process";

import { blocks } from "@/content/blocks";
import { SITE, sharePages } from "@/content/share";
import registry from "@/registry.json";

export const dynamic = "force-static";

/** The files a page is made of: its route and, for a docs entry or a block, its registry files and examples. */
function sources(path: string): string[] {
  const [, section, name] = path.split("/");
  if (section === "docs" && name) {
    const item = registry.items.find((i) => i.name === name);
    if (item) return [...item.files.map((f) => f.path), `examples/${name}`];
  }
  if (section === "blocks" && name && blocks.some((b) => b.name === name)) return (registry.items.find((i) => i.name === name)?.files ?? []).map((f) => f.path);
  return [path === "/" ? "app/page.tsx" : `app${path}/page.tsx`];
}

/** Each file's last change, newest first, from one pass over git's history; empty when git has none (a shallow clone). */
let changes: [file: string, date: string][] | undefined;
function history() {
  if (changes) return changes;
  changes = [];
  try {
    const log = execFileSync("git", ["log", "--relative", "--name-only", "--format=@%cI", "--", "."], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });
    let date = "";
    for (const line of log.split("\n")) {
      if (line.startsWith("@")) date = line.slice(1);
      else if (line) changes.push([line, date]);
    }
  } catch {
    // no git: no lastmod
  }
  return changes;
}

/** When the page's files last changed. */
function lastModified(path: string): Date | undefined {
  const files = sources(path);
  const hit = history().find(([file]) => files.some((f) => file === f || file.startsWith(`${f}/`)));
  return hit ? new Date(hit[1]) : undefined;
}

/** Every shareable page (frame-only and error pages are left out). Ready for hreflang: add alternates.languages per entry. */
export default function sitemap(): MetadataRoute.Sitemap {
  return sharePages().map((page) => ({ url: `${SITE.origin}${page.path}`, lastModified: lastModified(page.path) }));
}
