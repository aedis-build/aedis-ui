import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { INIT_ITEMS, run, VERSION } from "../src/cli";
import { encodePreset } from "../../../apps/www/content/preset";
import { bundleFor, fakeCheck, io, item, ITEMS, project, releaseArchive, releaseRoutes } from "./fixtures";

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

  it("installs with the workspace's pnpm, in the app folder, when run from an app inside a pnpm workspace (#223)", async () => {
    const workspace = project({ "pnpm-workspace.yaml": "packages:\n  - apps/*\n" });
    const app = path.join(workspace, "apps", "web");
    mkdirSync(app, { recursive: true });
    writeFileSync(path.join(app, "package.json"), '{"dependencies":{"shared":"workspace:*"}}');
    await run(["init", "--yes"], io(app, releaseRoutes(RELEASE)).io);
    const installs: { command: string; cwd: string }[] = [];
    const t = io(app, releaseRoutes(RELEASE), { spawn: (command, _args, { cwd }) => (installs.push({ command, cwd }), 0) });
    expect(await run(["add", "button", "--yes"], t.io)).toBe(0);
    expect(installs).toEqual([{ command: "pnpm", cwd: app }]);
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

  it("refuses an unverified registry unless allowed, and then says loudly it is not verified", async () => {
    const root = await initialized();
    const t = io(root, { "http://localhost:3000/r/untrusted.json": () => Response.json(ITEMS.untrusted) });
    expect(await run(["add", "untrusted", "--registry", "http://localhost:3000/r", "--yes"], t.io)).toBe(1);
    expect(t.lines.at(-1)).toMatch(/^error: refusing http:\/\/localhost:3000\/r: it is not a signed release/);
    expect(t.calls.some((c) => c.startsWith("http://localhost:3000"))).toBe(false);
    t.lines.length = 0;
    expect(await run(["add", "untrusted", "--registry", "http://localhost:3000/r", "--allow-unverified", "--yes"], t.io)).toBe(0);
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

describe("third-party registries", () => {
  const ACME = "https://github.com/acme/ui";
  const card = { name: "card", type: "registry:ui", registryDependencies: ["@acme/tokens"], files: [{ path: "registry/acme/ui/card.tsx", type: "registry:ui", content: "export const card = 1;\n" }] };
  const tokens = { name: "tokens", type: "registry:lib", files: [{ path: "lib/tokens.ts", type: "registry:lib", content: "export {};\n" }] };
  const acmeArchive = (items: Record<string, unknown> = { card, tokens }) => releaseArchive(items);
  const bundle = (archive: Buffer) => bundleFor(archive, "v1.0.0", { name: "ui-registry-v1.0.0.tgz", repository: ACME });

  async function initialized() {
    const root = project();
    await run(["init", "--yes"], io(root, releaseRoutes(RELEASE)).io);
    return root;
  }

  it("verifies a third-party registry with the same checks as Aedis UI before writing", async () => {
    const root = await initialized();
    const archive = acmeArchive();
    const t = io(root, releaseRoutes("v1.0.0", archive, bundle(archive), ACME), { check: fakeCheck("v1.0.0", ACME) });
    expect(await run(["add", "@acme/card", "--registry", "github:acme/ui@v1.0.0", "--yes"], t.io)).toBe(0);
    expect(t.lines).toContain("from acme/ui v1.0.0 (verified):");
    expect(existsSync(path.join(root, "components/ui/card.tsx"))).toBe(true);
    expect(existsSync(path.join(root, "lib/tokens.ts"))).toBe(true);
  });

  it("refuses an unsigned, mis-signed or tampered third-party release and writes nothing", async () => {
    const root = await initialized();
    const archive = acmeArchive();
    const cases: [Record<string, () => Response>, ReturnType<typeof fakeCheck>, RegExp][] = [
      [releaseRoutes("v1.0.0", archive, null, ACME), fakeCheck("v1.0.0", ACME), /missing attestation/],
      [releaseRoutes("v1.0.0", archive, bundle(archive), ACME), fakeCheck("v1.0.0"), /signature does not verify for https:\/\/github.com\/acme\/ui/],
      [releaseRoutes("v1.0.0", archive, bundleFor(archive, "v1.0.0", { name: "ui-registry-v1.0.0.tgz" }), ACME), fakeCheck("v1.0.0", ACME), /built from https:\/\/github.com\/aedis-build\/aedis-ui/],
      [releaseRoutes("v1.0.0", acmeArchive({ card, tokens: { ...tokens, files: [{ ...tokens.files[0], content: "evil" }] } }), bundle(archive), ACME), fakeCheck("v1.0.0", ACME), /tampered or replaced/],
    ];
    for (const [routes, check, error] of cases) {
      const t = io(root, routes, { check });
      expect(await run(["add", "@acme/card", "--registry", "github:acme/ui@v1.0.0", "--yes"], t.io)).toBe(1);
      expect(t.lines.at(-1)).toMatch(error);
    }
    expect(existsSync(path.join(root, "components/ui/card.tsx"))).toBe(false);
  });

  it("holds third-party npm dependencies to exact, aged pins, and its items to their own namespace", async () => {
    const root = await initialized();
    const fresh = { ...card, registryDependencies: [], dependencies: ["brand-new"] };
    const foreign = { ...card, registryDependencies: ["@aedis/button"] };
    for (const [items, error] of [[{ card: fresh }, /brand-new/], [{ card: foreign }, /depends on @aedis\/button, outside @acme/]] as const) {
      const archive = acmeArchive(items);
      const t = io(root, releaseRoutes("v1.0.0", archive, bundle(archive), ACME), { check: fakeCheck("v1.0.0", ACME) });
      expect(await run(["add", "card", "--registry", "github:acme/ui@v1.0.0", "--yes"], t.io)).toBe(1);
      expect(t.lines.at(-1)).toMatch(error);
    }
    expect(existsSync(path.join(root, "components/ui/card.tsx"))).toBe(false);
  });
});

describe("aedis lint", () => {
  it("passes the Aedis UI registry itself", async () => {
    const t = io(path.resolve("../../apps/www"), {});
    expect(await run(["lint"], t.io)).toBe(0);
    expect(t.lines.at(-1)).toBe("aedis lint: every item passes");
  });

  it("reports markup, unbounded fields and direct transport, and honours an exemption with a reason", async () => {
    const root = project({
      "registry.json": JSON.stringify({
        items: [
          { name: "bad", files: [{ path: "bad.tsx" }] },
          { name: "client", files: [{ path: "client.ts" }], meta: { aedisLint: { transport: "this is the registry's api()" } } },
          { name: "empty", files: [{ path: "client.ts" }], meta: { aedisLint: { transport: " " } } },
        ],
      }),
      "bad.tsx": 'export const A = () => <div dangerouslySetInnerHTML={{ __html: x }} />;\nexport const B = () => <textarea name="q" />;\nexport const C = () => <input type="file" />;\nexport const D = () => <input maxLength={9} />;\n',
      "client.ts": 'export const get = () => fetch("/x");\n',
    });
    const t = io(root, {});
    expect(await run(["lint"], t.io)).toBe(1);
    expect(t.lines.slice(0, -1)).toEqual([
      "  bad bad.tsx:1 renders a string as markup (markup): export const A = () => <div dangerouslySetInnerHTML={{ __html: x }} />;",
      '  bad bad.tsx:2 a text field without maxLength (input): <textarea name="q" />',
      '  empty client.ts:1 talks to the backend without api() (transport): export const get = () => fetch("/x");',
    ]);
  });

  it("refuses files outside the registry and a registry without items", async () => {
    const outside = project({ "registry.json": JSON.stringify({ items: [{ name: "x", files: [{ path: "../secret" }] }] }) });
    const t = io(outside, {});
    expect(await run(["lint"], t.io)).toBe(1);
    expect(t.lines.at(-1)).toMatch(/outside the registry/);
    const none = project({ "registry.json": "{}" });
    expect(await run(["lint"], io(none, {}).io)).toBe(1);
  });
});

describe("aedis init --preset", () => {
  const items = { ...ITEMS, "use-idle-timeout": item("use-idle-timeout"), "approval-card": item("approval-card"), "agent-console": item("agent-console", { registryDependencies: ["@aedis/approval-card"] }) };
  const routes = () => releaseRoutes(RELEASE, releaseArchive(items));
  const id = encodePreset({ framework: "n", theme: "b", radius: "l", motion: "o", level: "3", blocks: ["agent-console"] });

  it("shows the preset, asks, then installs its level and blocks and writes its validated theme", async () => {
    const root = project();
    const asked: string[] = [];
    const t = io(root, routes(), { confirm: async (q) => (asked.push(q), true) });
    expect(await run(["init", "--preset", id], t.io)).toBe(0);
    expect(t.lines[0]).toBe(`preset ${id}:\n${JSON.stringify({ framework: "Next.js", theme: "Brand", radius: "Large", motion: "Off", security: "L3 Regulated", blocks: ["Agent console"] }, null, 2)}`);
    expect(asked).toEqual(["Write these files?"]);
    for (const f of ["components/ui/use-idle-timeout.tsx", "components/ui/approval-card.tsx", "components/ui/agent-console.tsx", "aedis.json"]) expect(existsSync(path.join(root, f)), f).toBe(true);
    const css = readFileSync(path.join(root, "styles/aedis-custom-theme.css"), "utf8");
    expect(css).toContain("--primary: #1a2740;");
    expect(css).toContain("--duration-spring: 0ms;");
    expect(t.lines).toContainEqual(expect.stringMatching(/^L3 Regulated: the platform adds DAST gate/));
  });

  it("rejects a tampered or foreign preset and writes nothing", async () => {
    const root = project();
    for (const [bad, error] of [[id.replace("3-", "1-"), /checksum does not match/], ["nbms3-01-$(id)", /not a preset id/]] as const) {
      const t = io(root, routes());
      expect(await run(["init", "--preset", bad, "--yes"], t.io)).toBe(1);
      expect(t.lines.at(-1)).toMatch(error);
      expect(t.calls).toEqual([]);
    }
    expect(existsSync(path.join(root, "aedis.json"))).toBe(false);
  });

  it("writes nothing when the person says no", async () => {
    const root = project();
    const t = io(root, routes(), { confirm: async () => false });
    expect(await run(["init", "--preset", id], t.io)).toBe(1);
    expect(existsSync(path.join(root, "styles/aedis-custom-theme.css"))).toBe(false);
    expect(existsSync(path.join(root, "aedis.json"))).toBe(false);
  });
});
