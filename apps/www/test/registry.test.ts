import { existsSync, readFileSync } from "node:fs";

// Vitest runs from apps/www (in jsdom, import.meta.url is not a file: URL).
const root = `${process.cwd()}/`;
const registry = JSON.parse(readFileSync(`${root}registry.json`, "utf8")) as {
  items: { name: string; registryDependencies?: string[]; files: { path: string }[] }[];
};

describe("registry", () => {
  it("depends only on Aedis items, so installs never pull packages Aedis did not choose", () => {
    // The default shadcn `utils` item now re-exports an extra npm package; Aedis ships its own.
    const external = registry.items.flatMap((i) => (i.registryDependencies ?? []).filter((d) => !d.startsWith("@aedis/")));
    expect(external).toEqual([]);
  });

  it("points every item at files that exist", () => {
    const missing = registry.items.flatMap((i) => i.files.map((f) => f.path)).filter((p) => !existsSync(`${root}${p}`));
    expect(missing).toEqual([]);
  });

  it("resolves every @aedis dependency to an item in this registry", () => {
    const names = new Set(registry.items.map((i) => i.name));
    const unknown = registry.items.flatMap((i) => i.registryDependencies ?? []).filter((d) => !names.has(d.replace("@aedis/", "")));
    expect(unknown).toEqual([]);
  });
});
