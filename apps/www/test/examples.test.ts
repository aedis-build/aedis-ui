import { exampleSource } from "@/components/site/example-source";
import { components } from "@/content/components";

const modules = import.meta.glob("../examples/**/*.tsx", { eager: true }) as Record<string, { default: unknown }>;
const files = Object.keys(modules).map((k) => k.replace("../examples/", "").replace(/\.tsx$/, ""));
const examples = components.flatMap((c) => (c.examples ?? []).map((e) => ({ ...e, doc: c.name })));

describe("docs examples", () => {
  it("render the file whose source the Code tab shows", () => {
    for (const e of examples) expect(modules[`../examples/${e.file}.tsx`]?.default, e.file).toBe(e.component);
  });

  it("are all listed, so no file in examples/ is orphaned", () => {
    expect(files.sort()).toEqual(examples.map((e) => e.file).sort());
  });

  it("show imports as the reader's project has them", () => {
    const code = exampleSource("dropdown-menu/demo");
    expect(code).toContain('from "@/components/ui/dropdown-menu"');
    expect(code).not.toContain("@/registry/");
  });
});
