import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { blocks } from "@/content/blocks";
import { components } from "@/content/components";
import registry from "@/registry.json";

// The development rule (CONTRIBUTING, "Every feature ships with a live demo and a Playwright test"): every registry
// item has a live demo on the site, and a Playwright spec that opens its page and proves the demo works.

/** Data-only items with nothing to show or click. */
const EXEMPT = ["utils", "locale-pt-br", "locale-es"];

// Items older than the rule. These lists only shrink: remove a name when its demo or spec lands, never add one.
const LEGACY_NO_DEMO = [
  "api", "attachment", "bff-stream", "custom-theme", "event-stream", "locale", "mf-bridge", "mf-context", "mf-element",
  "mf-embed-headers", "mf-frame", "reasoning", "redact", "secure-action", "share-metadata", "untrusted",
  "use-event-stream", "use-format", "use-idle-timeout", "use-reduced-motion", "use-stick-to-bottom",
];
const LEGACY_NO_SPEC = [
  "api", "area-chart", "attachment", "avatar", "badge", "bff-stream", "breadcrumb", "chart", "collapsible", "custom-theme",
  "empty", "event-stream", "hand-raise", "item", "kbd", "label", "line-chart", "locale", "markdown", "mf-bridge", "mf-context",
  "mf-element", "mf-embed-headers", "mf-frame", "radial-chart", "reasoning", "redact", "scroll-area", "secure-action",
  "separator", "share-card", "share-metadata", "sheet", "sources", "spinner", "streaming-markdown",
  "table", "untrusted", "use-event-stream", "use-format", "use-idle-timeout", "use-reduced-motion", "use-stick-to-bottom",
];

const items = registry.items.filter((i) => i.type !== "registry:file" && !EXEMPT.includes(i.name));
const isBlock = (name: string) => blocks.some((b) => b.name === name);
const page = (name: string) => (isBlock(name) ? `/blocks/${name}` : `/docs/${name}`);

const specDir = join(process.cwd(), "visual");
const specs = readdirSync(specDir)
  .filter((f) => f.endsWith(".spec.ts"))
  .map((f) => readFileSync(join(specDir, f), "utf8"))
  .join("\n");

const hasDemo = (name: string) => isBlock(name) || !!components.find((c) => c.name === name)?.examples?.length;
const hasSpec = (name: string) => specs.includes(`"${page(name)}"`) || specs.includes(`'${page(name)}'`) || specs.includes(`/blocks/view/${name}`);

describe("every feature ships with a live demo and a Playwright test", () => {
  it("has a live demo on the site", () => {
    expect(items.filter((i) => !hasDemo(i.name) && !LEGACY_NO_DEMO.includes(i.name)).map((i) => i.name)).toEqual([]);
  });

  it("has a Playwright spec that opens its page", () => {
    expect(items.filter((i) => !hasSpec(i.name) && !LEGACY_NO_SPEC.includes(i.name)).map((i) => i.name)).toEqual([]);
  });

  it("keeps the legacy lists honest: a name leaves the list once its demo or spec exists", () => {
    expect(LEGACY_NO_DEMO.filter(hasDemo)).toEqual([]);
    expect(LEGACY_NO_SPEC.filter(hasSpec)).toEqual([]);
    const names = new Set(items.map((i) => i.name));
    expect([...LEGACY_NO_DEMO, ...LEGACY_NO_SPEC].filter((n) => !names.has(n))).toEqual([]);
  });
});
