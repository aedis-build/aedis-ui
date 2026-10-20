import path from "node:path";
import fc from "fast-check";

import { defaultConfig, readConfig } from "../src/config";
import { detectPackageManager, installCommand, pickVersions } from "../src/deps";
import { lineDiff } from "../src/diff";
import { insideProject } from "../src/paths";
import { parseItem, releaseSource, resolveItems, urlSource } from "../src/registry";
import { readTarGz } from "../src/tar";
import { themeImport } from "../src/theme";
import { planFiles, rewriteImports, targetOf } from "../src/transform";
import { verifyRelease } from "../src/verify";
import { bundleFor, fakeCheck, fakeFetch, ITEMS, NOW, project, releaseArchive, releaseRoutes, tarGz } from "./fixtures";

const ROOT = path.resolve("/tmp/app");
const config = defaultConfig(ROOT, "v0.1.0");

describe("insideProject", () => {
  it("keeps paths inside the project and refuses the rest", () => {
    expect(insideProject(ROOT, "components/ui/button.tsx")).toBe(path.join(ROOT, "components", "ui", "button.tsx"));
    for (const bad of ["../evil.ts", "a/../../evil", "/etc/passwd", "C:\\Windows\\x", "c:/x", "~/x", "a\\..\\..\\x", "a\u0000b", "", ".", "x".repeat(401)]) {
      expect(() => insideProject(ROOT, bad), bad).toThrow(/refused path/);
    }
  });

  it("never returns a path outside the project, whatever the input (property)", () => {
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.constantFrom("..", ".", "", "/", "\\", "~", "C:", "a", "b.ts"), fc.string()), { maxLength: 6 }), fc.constantFrom("/", "\\"), (parts, sep) => {
        let out: string;
        try {
          out = insideProject(ROOT, parts.join(sep));
        } catch {
          return;
        }
        expect(out.startsWith(ROOT + path.sep)).toBe(true);
        expect(path.relative(ROOT, out).split(path.sep)).not.toContain("..");
      }),
    );
  });
});

describe("readTarGz", () => {
  it("reads regular files and refuses links", () => {
    const files = readTarGz(tarGz({ "r/a.json": "{}", "./r/b.json": "[]" }));
    expect([...files.keys()]).toEqual(["r/a.json", "r/b.json"]);
    expect(() => readTarGz(tarGz({ "r/link": "x" }, { type: "2" }))).toThrow(/refused entry type/);
  });
});

describe("config", () => {
  it("uses src/ when the project has it and validates aedis.json", () => {
    const root = project();
    expect(defaultConfig(root, "v1.0.0").paths.ui).toBe("components/ui");
    expect(readConfig(root)).toBeNull();
    const bad = project({ "aedis.json": JSON.stringify({ release: "latest", paths: { ui: "../x", lib: "lib", hooks: "hooks", styles: "styles" }, aliases: { ui: "@/x", lib: "@/lib", hooks: "@/h y" } }) });
    expect(() => readConfig(bad)).toThrow(/release must look like v1.2.3; paths.ui must be a relative directory; aliases.hooks must be an import alias/);
  });
});

describe("verifyRelease", () => {
  const archive = releaseArchive();
  const ok = { archive, release: "v0.1.0", assetName: "aedis-ui-registry-v0.1.0.tgz", check: fakeCheck("v0.1.0") };

  it("accepts the release signed and built by this repository's release workflow", async () => {
    await expect(verifyRelease({ ...ok, bundle: bundleFor(archive, "v0.1.0") })).resolves.toMatchObject({ digest: expect.stringMatching(/^[0-9a-f]{64}$/) });
  });

  it.each([
    ["a tampered archive", { archive: Buffer.concat([archive, Buffer.from("x")]) }, {}, /tampered or replaced/],
    ["a missing attestation", {}, null, /missing attestation/],
    ["another workflow", {}, { path: ".github/workflows/evil.yml" }, /built by .github\/workflows\/evil.yml/],
    ["another repository", {}, { repository: "https://github.com/evil/aedis-ui" }, /built from https:\/\/github.com\/evil\/aedis-ui/],
    ["another tag", {}, { ref: "refs/tags/v9.9.9" }, /built from refs\/tags\/v9.9.9/],
    ["another file", {}, { name: "other.tgz" }, /does not name/],
  ] as const)("refuses %s", async (_label, change, bundleChange, error) => {
    const bundle = bundleChange === null ? null : bundleFor(archive, "v0.1.0", bundleChange);
    await expect(verifyRelease({ ...ok, ...change, bundle })).rejects.toThrow(error);
  });

  it("refuses a signature from another identity and malformed statements", async () => {
    await expect(verifyRelease({ ...ok, check: fakeCheck("v0.0.9"), bundle: bundleFor(archive, "v0.1.0") })).rejects.toThrow(/signature does not verify/);
    await expect(verifyRelease({ ...ok, bundle: { dsseEnvelope: { payloadType: "text/plain", payload: "e30=" } } })).rejects.toThrow(/no in-toto statement/);
    await expect(verifyRelease({ ...ok, bundle: { dsseEnvelope: { payloadType: "application/vnd.in-toto+json", payload: Buffer.from("not json").toString("base64") } } })).rejects.toThrow(/not JSON/);
    const typed = (payload: object) => ({ dsseEnvelope: { payloadType: "application/vnd.in-toto+json", payload: Buffer.from(JSON.stringify(payload)).toString("base64") } });
    await expect(verifyRelease({ ...ok, bundle: typed({ _type: "x" }) })).rejects.toThrow(/unexpected statement type/);
    await expect(verifyRelease({ ...ok, bundle: typed({ _type: "https://in-toto.io/Statement/v1", predicateType: "x" }) })).rejects.toThrow(/not SLSA/);
  });
});

describe("registry", () => {
  it("reads items only after the release verifies", async () => {
    const { fetcher } = fakeFetch(releaseRoutes("v0.1.0"));
    const source = await releaseSource("v0.1.0", { fetcher, check: fakeCheck("v0.1.0") });
    expect(source.verified).toBe(true);
    expect((await source.get("button")).name).toBe("button");
    await expect(source.get("missing")).rejects.toThrow(/not in v0.1.0/);
    await expect(source.get("../etc")).rejects.toThrow(/invalid item name/);
    const tampered = fakeFetch(releaseRoutes("v0.1.0", releaseArchive(), bundleFor(Buffer.from("other"), "v0.1.0")));
    await expect(releaseSource("v0.1.0", { fetcher: tampered.fetcher, check: fakeCheck("v0.1.0") })).rejects.toThrow(/tampered/);
    const noBundle = fakeFetch(releaseRoutes("v0.1.0", releaseArchive(), null));
    await expect(releaseSource("v0.1.0", { fetcher: noBundle.fetcher, check: fakeCheck("v0.1.0") })).rejects.toThrow(/missing attestation/);
    await expect(releaseSource("v0.2.0", { fetcher, check: fakeCheck("v0.2.0") })).rejects.toThrow(/download failed \(404\)/);
  });

  it("resolves dependencies first, once, refuses foreign namespaces and survives cycles", async () => {
    const items: Record<string, unknown> = { ...ITEMS, a: { ...ITEMS.button, name: "a", registryDependencies: ["@aedis/b"] }, b: { ...ITEMS.button, name: "b", registryDependencies: ["@aedis/a"] }, bad: { ...ITEMS.button, name: "bad", registryDependencies: ["@shadcn/utils"] } };
    const source = { verified: false, label: "t", get: async (n: string) => parseItem(items[n], n) };
    expect((await resolveItems(["button", "@aedis/button"], source)).map((i) => i.name)).toEqual(["utils", "theme", "button"]);
    expect((await resolveItems(["a"], source)).map((i) => i.name)).toEqual(["b", "a"]);
    await expect(resolveItems(["bad"], source)).rejects.toThrow(/outside @aedis/);
  });

  it("validates item shapes", () => {
    expect(() => parseItem({ name: "x", files: [] }, "x")).toThrow(/no files/);
    expect(() => parseItem({ name: "y", files: [{}] }, "x")).toThrow(/missing or misnamed/);
    expect(() => parseItem({ name: "x", files: [{ path: "a", type: "t" }] }, "x")).toThrow(/malformed file/);
    expect(() => parseItem({ name: "x", dependencies: [1], files: [{ path: "a", type: "t", content: "" }] }, "x")).toThrow(/list of strings/);
    expect(() => parseItem({ name: "x", files: [{ path: "a", type: "t", content: "", target: 1 }] }, "x")).toThrow(/malformed target/);
  });

  it("reads an unverified URL registry and refuses other schemes", async () => {
    const { fetcher, calls } = fakeFetch({ "http://localhost:3000/r/button.json": () => Response.json(ITEMS.button) });
    const source = urlSource("http://localhost:3000/r", { fetcher });
    expect(source.verified).toBe(false);
    expect((await source.get("button")).name).toBe("button");
    expect(calls).toEqual(["http://localhost:3000/r/button.json"]);
    expect(() => urlSource("file:///etc")).toThrow(/http\(s\)/);
    await expect(source.get("..")).rejects.toThrow(/invalid item name/);
  });
});

describe("transform", () => {
  it("maps file types to the project's folders and rewrites registry imports", async () => {
    const items = [parseItem(ITEMS.button, "button"), parseItem(ITEMS.theme, "theme"), parseItem(ITEMS["use-thing"], "use-thing"), parseItem(ITEMS.utils, "utils")];
    const planned = planFiles(items, config, ROOT);
    expect(planned.map((p) => p.relative)).toEqual(["components/ui/button.tsx", "styles/aedis-theme.css", "hooks/use-thing.ts", "lib/utils.ts"]);
    expect(planned[0].content).toContain('from "@/lib/utils"');
    expect(planned[0].content).toContain('from "@/components/ui/x"');
    expect(planned[2].content).toContain('from "@/lib/a"');
    expect(rewriteImports('import "@/registry/aedis/hooks/h"', { ...config, aliases: { ui: "~/ui", lib: "~/lib", hooks: "~/hooks" } })).toBe('import "~/hooks/h"');
    expect(() => targetOf({ path: "a", type: "registry:file", content: "" }, config)).toThrow(/no target/);
    expect(() => targetOf({ path: "a", type: "registry:block", content: "" }, config)).toThrow(/unsupported/);
    expect(() => planFiles([parseItem({ ...ITEMS.theme, files: [{ ...ITEMS.theme.files[0], target: "../../.ssh/authorized_keys" }] }, "theme")], config, ROOT)).toThrow(/refused path/);
  });
});

describe("dependencies", () => {
  it("detects the package manager from the lockfile", () => {
    const has = (files: Record<string, string>) => [(p: string) => path.basename(p) in files, (p: string) => files[path.basename(p)]] as const;
    expect(detectPackageManager(ROOT, ...has({ "pnpm-lock.yaml": "" }))).toBe("pnpm");
    expect(detectPackageManager(ROOT, ...has({ "bun.lock": "" }))).toBe("bun");
    expect(detectPackageManager(ROOT, ...has({ "yarn.lock": "__metadata:\n  version: 8" }))).toBe("yarn");
    expect(detectPackageManager(ROOT, ...has({ "yarn.lock": "# yarn lockfile v1" }))).toBe("yarn1");
    expect(detectPackageManager(ROOT, ...has({ "package-lock.json": "" }))).toBe("npm");
    expect(detectPackageManager(ROOT, ...has({}))).toBe("npm");
  });

  it("installs exact versions without lifecycle scripts", () => {
    expect(installCommand("pnpm", ["a@1.0.0"])).toEqual({ command: "pnpm", args: ["add", "--save-exact", "--ignore-scripts", "a@1.0.0"], env: {} });
    expect(installCommand("npm", ["@s/a@1.0.0"]).args).toEqual(["install", "--save-exact", "--ignore-scripts", "@s/a@1.0.0"]);
    expect(installCommand("yarn", ["a@1.0.0"])).toEqual({ command: "yarn", args: ["add", "--exact", "a@1.0.0"], env: { YARN_ENABLE_SCRIPTS: "false" } });
    expect(installCommand("yarn1", ["a@1.0.0"]).args).toContain("--ignore-scripts");
    expect(installCommand("bun", ["a@1.0.0"]).args).toEqual(["add", "--exact", "--ignore-scripts", "a@1.0.0"]);
    for (const bad of ["a@^1.0.0", "a", "a@1.0.0 && rm -rf /", "../a@1.0.0"]) expect(() => installCommand("npm", [bad])).toThrow(/refused/);
  });

  it("picks versions at least 7 days old from the npm registry itself", async () => {
    const { fetcher } = fakeFetch({});
    expect(await pickVersions(["@base-ui/react@1.9.0", "class-variance-authority", "tailwind-merge", "clsx", "clsx"], { fetcher, now: NOW })).toEqual([
      "@base-ui/react@1.9.0",
      "class-variance-authority@0.7.1",
      "tailwind-merge@3.6.0",
      "clsx@2.1.1",
    ]);
    await expect(pickVersions(["brand-new@1.0.0"], { fetcher, now: NOW })).rejects.toThrow(/younger than 7 days/);
    await expect(pickVersions(["brand-new"], { fetcher, now: NOW })).rejects.toThrow(/no version of brand-new is 7 days old/);
    await expect(pickVersions(["clsx@9.9.9"], { fetcher, now: NOW })).rejects.toThrow(/does not exist/);
    await expect(pickVersions(["ghost"], { fetcher, now: NOW })).rejects.toThrow(/npm registry: ghost \(404\)/);
    await expect(pickVersions(["clsx@^2"], { fetcher, now: NOW })).rejects.toThrow(/use a name or name@x.y.z/);
    await expect(pickVersions(["clsx@2.1.1", "clsx@2.1.0"], { fetcher, now: NOW })).rejects.toThrow(/conflicting versions/);
  });
});

describe("lineDiff", () => {
  it("shows what differs with context, and nothing when equal", () => {
    expect(lineDiff("a\nb\nc", "a\nb\nc")).toBeNull();
    expect(lineDiff("a\nb\nc\nd\ne\nf\ng", "a\nb\nc\nX\ne\nf\ng", 1)).toBe("  …\n  c\n- d\n+ X\n  e\n  …");
    expect(lineDiff("x", "x\ny")).toBe("  x\n+ y");
  });
});

describe("themeImport", () => {
  it("accepts a typed theme and refuses CSS or unreadable colors", () => {
    const ok = themeImport(JSON.stringify({ version: 1, name: "Acme */ body{}", colors: { light: { primary: "#0b6e4f" }, dark: {} } }), "acme.json");
    expect(ok).toMatchObject({ ok: true, name: "Acme  body{}" });
    expect(ok.ok && ok.css).toContain("--primary: #0b6e4f;");
    expect(ok.ok && ok.css.split("*/")).toHaveLength(2);
    expect(themeImport(JSON.stringify({ version: 1, name: "x", colors: { light: { primary: "url(x)" }, dark: {} } }), "x.json")).toMatchObject({ ok: false });
    expect(themeImport("{", "x.json")).toEqual({ ok: false, errors: ["theme is not valid JSON"] });
  });
});
