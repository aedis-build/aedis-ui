import { exampleSource } from "@/components/site/example-source";
import { blocks } from "@/content/blocks";
import { components } from "@/content/components";
import registry from "@/registry.json";

const modules = import.meta.glob("../examples/**/*.tsx", { eager: true }) as Record<string, { default: unknown }>;
const files = Object.keys(modules).map((k) => k.replace("../examples/", "").replace(/\.tsx$/, ""));
const examples = [
  ...components.flatMap((c) => (c.examples ?? []).map((e) => ({ file: e.file, component: e.component }))),
  ...blocks.map((b) => ({ file: b.demoFile, component: b.demo })),
];

describe("docs examples", () => {
  it("render the file whose source the Code tab shows", () => {
    for (const e of examples) expect(modules[`../examples/${e.file}.tsx`]?.default, e.file).toBe(e.component);
  });

  it("are all listed, so no file in examples/ is orphaned", () => {
    expect(files.sort()).toEqual(examples.map((e) => e.file).sort());
  });

  it("cover every UI item with a preview and accessibility notes", () => {
    const ui = new Set(registry.items.filter((i) => i.type === "registry:ui").map((i) => i.name));
    // mf-frame shows an app from another origin, and the docs have none to embed live.
    const docs = components.filter((c) => ui.has(c.name) && c.name !== "mf-frame");
    expect(docs.filter((c) => !c.examples?.length).map((c) => c.name)).toEqual([]);
    expect(components.filter((c) => ui.has(c.name) && !c.accessibility).map((c) => c.name)).toEqual([]);
  });

  it("show imports as the reader's project has them", () => {
    const code = exampleSource("dropdown-menu/demo");
    expect(code).toContain('from "@/components/ui/dropdown-menu"');
    expect(code).not.toContain("@/registry/");
  });
});
