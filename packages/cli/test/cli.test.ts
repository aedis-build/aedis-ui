import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { INIT_ITEMS, run, VERSION } from "../src/cli";
import { bundleFor, fakeCheck, io, ITEMS, project, releaseArchive, releaseRoutes } from "./fixtures";

const RELEASE = `v${VERSION}`;
const read = (root: string, f: string) => readFileSync(path.join(root, f), "utf8");

describe("aedis init", () => {
  it("verifies the release, writes config, theme, cn and the security primitives, and installs aged exact deps", async () => {
    const root = project({ "pnpm-lock.yaml": "" });
    const t = io(root, releaseRoutes(RELEASE));
    expect(await run(["init", "--yes"], t.io)).toBe(0);
    expect(INIT_ITEMS).toEqual(["theme", "utils", "untrusted", "api", "security-headers"]);
    for (const f of ["styles/aedis-theme.css", "lib/utils.ts", "lib/untrusted.ts", "lib/api.ts", "lib/security-headers.ts"]) expect(existsSync(path.join(root, f)), f).toBe(true);
    expect(JSON.parse(read(root, "aedis.json"))).toMatchObject({ release: RELEASE, paths: { ui: "components/ui" } });
    expect(t.lines).toContain(`from aedis-build/aedis-ui ${RELEASE} (verified):`);
    expect(t.spawned).toEqual([{ command: "pnpm", args: ["add", "--save-exact", "--ignore-scripts", "clsx@2.1.1", "tailwind-merge@3.6.0"], env: {} }]);
  });

  it("writes nothing when the release does not verify", async () => {
    const root = project();
    const archive = releaseArchive();
    const t = io(root, releaseRoutes(RELEASE, archive, bundleFor(archive, RELEASE, { path: ".github/workflows/evil.yml" })));
    expect(await run(["init", "--yes"], t.io)).toBe(1);
    expect(t.lines.at(-1)).toMatch(/error: provenance: built by .github\/workflows\/evil.yml/);
    expect(existsSync(path.join(root, "lib"))).toBe(false);
    expect(existsSync(path.join(root, "aedis.json"))).toBe(false);
  });
});

describe("aedis add", () => {
  async function initialized(files: Record<string, string> = {}) {
    const root = project(files);
    await run(["init", "--yes"], io(root, releaseRoutes(RELEASE)).io);
    return root;
  }

  it("adds an item with its registry dependencies, rewritten imports and exact npm dependencies", async () => {
    const root = await initialized({ "package-lock.json": "{}" });
    const t = io(root, releaseRoutes(RELEASE));
    expect(await run(["add", "button", "--yes"], t.io)).toBe(0);
    expect(read(root, "components/ui/button.tsx")).toContain('from "@/components/ui/x"');
    expect(t.lines.some((l) => l.includes("unchanged lib/utils.ts"))).toBe(true);
    expect(t.lines.some((l) => l.includes("create    components/ui/button.tsx"))).toBe(true);
    expect(t.spawned.at(-1)!.args).toEqual(["install", "--save-exact", "--ignore-scripts", "clsx@2.1.1", "tailwind-merge@3.6.0", "@base-ui/react@1.9.0", "class-variance-authority@0.7.1"]);
  });

  it("shows the files and writes nothing when the person says no", async () => {
    const root = await initialized();
    const t = io(root, releaseRoutes(RELEASE), { confirm: async () => false });
    expect(await run(["add", "button"], t.io)).toBe(1);
    expect(t.lines).toContain("nothing written");
    expect(existsSync(path.join(root, "components/ui/button.tsx"))).toBe(false);
  });

  it("refuses to overwrite a local copy that differs, unless asked", async () => {
    const root = await initialized();
    writeFileSync(path.join(root, "lib/utils.ts"), "export const cn = 2;\n");
    const t = io(root, releaseRoutes(RELEASE));
    expect(await run(["add", "utils", "--yes"], t.io)).toBe(1);
    expect(t.lines).toContain("  local copy differs: lib/utils.ts");
    expect(await run(["add", "utils", "--yes", "--overwrite"], t.io)).toBe(0);
    expect(read(root, "lib/utils.ts")).toBe("export const cn = 1;\n");
  });

  it("says loudly that another registry is not verified", async () => {
    const root = await initialized();
    const t = io(root, { "http://localhost:3000/r/untrusted.json": () => Response.json(ITEMS.untrusted) });
    expect(await run(["add", "untrusted", "--registry", "http://localhost:3000/r", "--yes"], t.io)).toBe(0);
    expect(t.lines[0]).toBe("warning: http://localhost:3000/r is not a signed release; provenance is NOT verified.");
    expect(t.lines).toContain("from http://localhost:3000/r/ (NOT verified):");
  });

  it("verifies another pinned release and refuses one signed for a different tag", async () => {
    const root = await initialized();
    const t = io(root, releaseRoutes("v0.2.0"), { check: fakeCheck("v0.1.0") });
    expect(await run(["add", "api", "--release", "v0.2.0", "--yes"], t.io)).toBe(1);
    expect(t.lines.at(-1)).toMatch(/signature does not verify/);
    expect(await run(["add", "api", "--release", "latest"], t.io)).toBe(1);
    expect(t.lines.at(-1)).toBe("error: invalid release latest");
  });

  it("fails when the package manager fails, and needs an item name", async () => {
    const root = await initialized();
    const t = io(root, releaseRoutes(RELEASE), { spawn: () => 1 });
    expect(await run(["add", "button", "--yes"], t.io)).toBe(1);
    expect(t.lines.at(-1)).toBe("error: npm exited with 1");
    expect(await run(["add"], t.io)).toBe(1);
  });
});

describe("aedis diff", () => {
  it("shows local edits against the verified registry", async () => {
    const root = project();
    await run(["init", "--yes"], io(root, releaseRoutes(RELEASE)).io);
    const t = io(root, releaseRoutes(RELEASE));
    expect(await run(["diff"], t.io)).toBe(0);
    expect(t.lines.at(-1)).toBe("up to date");
    writeFileSync(path.join(root, "lib/api.ts"), "export const hacked = true;\n");
    expect(await run(["diff", "api", "button"], t.io)).toBe(1);
    expect(t.lines.join("\n")).toMatch(/--- lib\/api.ts \(local\)[\s\S]*- export const hacked = true;[\s\S]*\+ export \{\};/);
    expect(t.lines).toContain("missing  components/ui/button.tsx");
  });
});

describe("aedis theme import", () => {
  it("writes the validated theme as CSS and refuses an unsafe one", async () => {
    const root = project({
      "acme.json": JSON.stringify({ version: 1, name: "Acme", colors: { light: { primary: "#0b6e4f" }, dark: {} } }),
      "evil.json": JSON.stringify({ version: 1, name: "Evil", colors: { light: { primary: "#fff; } body { display: none" }, dark: {} } }),
    });
    const t = io(root, {});
    expect(await run(["theme", "import", "acme.json"], t.io)).toBe(0);
    expect(read(root, "styles/aedis-custom-theme.css")).toContain("--primary: #0b6e4f;");
    expect(await run(["theme", "import", "evil.json"], t.io)).toBe(1);
    expect(t.lines).toContain("  colors.light.primary must be a hex color or oklch()");
    expect(await run(["theme", "import", "../outside.json"], t.io)).toBe(1);
    expect(t.lines.at(-1)).toMatch(/refused path/);
    expect(await run(["theme", "import"], t.io)).toBe(1);
  });
});

describe("aedis", () => {
  it("prints help and version, and refuses unknown commands, options and missing setup", async () => {
    const root = project();
    const t = io(root, {});
    expect(await run([], t.io)).toBe(0);
    expect(t.lines[0]).toContain(`npx @aedis/cli@${VERSION} add <item...>`);
    expect(t.lines[0]).not.toMatch(/npx aedis\b/);
    expect(await run(["--version"], t.io)).toBe(0);
    expect(t.lines.at(-1)).toBe(VERSION);
    expect(await run(["add", "button"], t.io)).toBe(1);
    expect(t.lines.at(-1)).toBe("error: no aedis.json: run aedis init first");
    expect(await run(["frobnicate"], t.io)).toBe(1);
    expect(await run(["add", "--wat"], t.io)).toBe(1);
    expect(t.lines.at(-1)).toBe("error: unknown option --wat");
    expect(await run(["add", "--registry"], t.io)).toBe(1);
    const empty = io(path.join(root, "nowhere"), {});
    expect(await run(["init"], empty.io)).toBe(1);
    expect(empty.lines.at(-1)).toMatch(/has no package.json/);
  });
});
