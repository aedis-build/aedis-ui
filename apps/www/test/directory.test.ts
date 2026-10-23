import { directory, installable } from "@/content/directory";
import registry from "@/registry.json";

describe("directory", () => {
  it("lists only registries the CLI can verify, each with an item that exists", () => {
    for (const entry of directory) {
      expect(installable(entry), entry.namespace).toBe(true);
      expect(entry.repository).toMatch(/^[\w.-]+\/[\w.-]+$/);
    }
    const aedis = directory.find((e) => e.namespace === "@aedis")!;
    expect(registry.items.some((i) => i.name === aedis.example)).toBe(true);
    expect(aedis.items).toBe(registry.items.length);
  });
});
