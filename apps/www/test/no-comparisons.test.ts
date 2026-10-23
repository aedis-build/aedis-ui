import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The site describes Aedis UI on its own terms (#134): no page names another UI library. Base UI is not in the list:
 * it is what the components are built on, stated as a fact of the stack. Code comments are exempt, and so is the
 * registry schema (components.json and registry.json live outside these folders).
 */
const OTHER_LIBRARIES = /shadcn|radix|material[ -]?ui|\bmui\b|chakra|mantine|ant design|\bantd\b|headless ?ui|daisy ?ui|ai elements|react[ -]?aria|next ?ui|hero ?ui|park ?ui|ark ?ui/i;

const roots = ["app", "components/site", "content"].map((d) => join(__dirname, "..", d));

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && /\.(tsx?|mdx?|txt|json)$/.test(e.name))
    .map((e) => join(e.parentPath, e.name));
}

/** The source without comments, so a note for maintainers never counts as something a reader sees. */
const withoutComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

describe("the site", () => {
  it("names no other UI library", () => {
    const found = roots.flatMap(files).flatMap((file) =>
      withoutComments(readFileSync(file, "utf8"))
        .split("\n")
        .filter((line) => OTHER_LIBRARIES.test(line))
        .map((line) => `${file}: ${line.trim().slice(0, 120)}`),
    );
    expect(found).toEqual([]);
  });

  it("would catch a mention, in copy or in metadata", () => {
    expect(OTHER_LIBRARIES.test('<Eyebrow>What shadcn does not give you</Eyebrow>')).toBe(true);
    expect(OTHER_LIBRARIES.test('description: "how it differs from Radix"')).toBe(true);
    expect(OTHER_LIBRARIES.test("Built on React, Base UI and Tailwind CSS")).toBe(false);
    expect(withoutComments("const a = 1; // like shadcn\n/* shadcn */")).not.toMatch(/shadcn/);
    expect(withoutComments('const url = "https://example.com"; ')).toContain("https://example.com");
  });
});
