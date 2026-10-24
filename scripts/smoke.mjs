// Smoke test of the release path, without publishing anything: packs @aedis/cli exactly as npm would publish it,
// installs that tarball in a scratch project, serves the registry built from this checkout, and runs init, add and
// diff against it (--allow-unverified: a local server carries no Sigstore release; the signed path has its own unit
// tests). Run after `pnpm build`: `pnpm smoke`. In CI it is one of aedis-ci's check-scripts, so every PR proves
// that what we would publish installs and works.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const registry = path.join(root, "apps/www/public/r");
const cli = path.join(root, "packages/cli");
const version = JSON.parse(readFileSync(path.join(cli, "package.json"), "utf8")).version;
// npm and pnpm are .cmd shims on Windows, which need a shell; every argument here is ours.
const shell = process.platform === "win32";

function fail(message) {
  console.error(`smoke: ${message}`);
  process.exit(1);
}

/**
 * Runs a command, streaming its output; a non-zero exit fails the smoke test (unless `allowFailure`). Asynchronous
 * on purpose: the registry server below lives in this process, and a blocking spawn would never let it answer.
 */
function run(command, args, cwd, { allowFailure = false, capture = false } = {}) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  return new Promise((resolve) => {
    let out = "";
    const child = spawn(command, args, { cwd, stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit", shell });
    child.stdout?.on("data", (d) => (out += d));
    child.on("close", (status) => {
      if (status !== 0 && !allowFailure) fail(`${command} ${args[0]} exited with ${status}`);
      resolve(capture ? out.trim() : status);
    });
  });
}

if (!existsSync(path.join(registry, "button.json")) || !existsSync(path.join(cli, "dist/aedis.js"))) fail("run pnpm build first (registry JSON and the CLI bundle are missing)");

// 1. The package as npm would publish it.
const scratch = mkdtempSync(path.join(tmpdir(), "aedis-smoke-"));
console.log(`\n$ pnpm -C ${cli} pack --pack-destination ${scratch} --json`);
const packed = spawnSync("pnpm", ["-C", cli, "pack", "--pack-destination", scratch, "--json"], { cwd: root, encoding: "utf8", shell });
if (packed.status !== 0) fail(`pnpm pack exited with ${packed.status}: ${packed.stderr}`);
const pack = JSON.parse(packed.stdout.slice(packed.stdout.indexOf("{")));
const tarball = path.basename(pack.filename);
const listed = pack.files.map((f) => f.path).sort();
const expected = ["LICENSE", "README.md", "dist/aedis.js", "package.json"];
if (JSON.stringify(listed) !== JSON.stringify(expected)) fail(`the tarball holds ${listed.join(", ")}; expected exactly ${expected.join(", ")}`);
console.log(`${tarball}: ${listed.join(", ")}`);

// 2. Installed in a project like a user's.
writeFileSync(path.join(scratch, "package.json"), JSON.stringify({ name: "smoke", private: true }, null, 2));
await run("npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts", `./${tarball}`], scratch);
const aedis = path.join(scratch, "node_modules", ".bin", "aedis");
const printed = await run(aedis, ["--version"], scratch, { capture: true });
if (printed !== version) fail(`aedis --version printed ${JSON.stringify(printed)}, package.json says ${version}`);

// 3. The registry built from this checkout, served as the site would (/r/<name>.json).
const server = createServer((req, res) => {
  const name = /^\/r\/([a-z0-9-]+)\.json$/.exec(req.url ?? "")?.[1];
  const file = name ? path.join(registry, `${name}.json`) : "";
  if (!file || !existsSync(file)) return void res.writeHead(404).end();
  res.writeHead(200, { "Content-Type": "application/json" }).end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const from = ["--registry", `http://127.0.0.1:${server.address().port}/r`, "--allow-unverified"];

try {
  await run(aedis, ["init", ...from, "--yes"], scratch);
  await run(aedis, ["add", "button", "approval-card", ...from, "--yes"], scratch);
  if ((await run(aedis, ["diff", ...from], scratch, { allowFailure: true })) !== 0) fail("diff reports differences right after add");
  const config = JSON.parse(readFileSync(path.join(scratch, "aedis.json"), "utf8"));
  for (const file of [`${config.paths.ui}/button.tsx`, `${config.paths.ui}/approval-card.tsx`, `${config.paths.lib}/utils.ts`, `${config.paths.lib}/untrusted.ts`]) {
    if (!existsSync(path.join(scratch, file))) fail(`${file} was not written`);
  }
  const { "@aedis/cli": _self, ...deps } = JSON.parse(readFileSync(path.join(scratch, "package.json"), "utf8")).dependencies ?? {};
  if (!deps["@base-ui/react"]) fail("@base-ui/react was not installed as a dependency of button");
  if (Object.values(deps).some((v) => !/^\d+\.\d+\.\d+$/.test(v))) fail(`a dependency is not pinned to an exact version: ${JSON.stringify(deps)}`);
  console.log(`\nsmoke: @aedis/cli@${version} installs from its tarball; init, add and diff work against ${readdirSync(registry).length} registry items; dependencies: ${Object.entries(deps).map(([k, v]) => `${k}@${v}`).join(" ")}`);

  // 4. The thin unscoped packages (aedis-cli, aedis-ui, create-aedis): packed as npm would publish them, installed
  // next to the @aedis/cli tarball they pin, and run through their bin files (no bin links: the three share `aedis`).
  const names = mkdtempSync(path.join(tmpdir(), "aedis-smoke-names-"));
  try {
    const tarballs = [path.join(scratch, tarball)];
    for (const name of ["aedis-cli", "aedis-ui", "create-aedis"]) {
      const dest = path.join(names, name);
      const packed = spawnSync("pnpm", ["-C", path.join(root, "packages", name), "pack", "--pack-destination", dest, "--json"], { cwd: root, encoding: "utf8", shell });
      if (packed.status !== 0) fail(`pnpm pack ${name} exited with ${packed.status}: ${packed.stderr}`);
      const pack = JSON.parse(packed.stdout.slice(packed.stdout.indexOf("{")));
      const files = pack.files.map((f) => f.path).sort();
      const bin = `bin/${name === "create-aedis" ? "create-aedis" : "aedis"}.js`;
      if (JSON.stringify(files) !== JSON.stringify(["LICENSE", "README.md", bin, "package.json"])) fail(`${name} tarball holds ${files.join(", ")}`);
      console.log(`${path.basename(pack.filename)}: ${files.join(", ")}`);
      tarballs.push(pack.filename);
    }
    writeFileSync(path.join(names, "package.json"), JSON.stringify({ name: "smoke-names", private: true }, null, 2));
    await run("npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts", "--no-bin-links", ...tarballs], names);
    for (const name of ["aedis-cli", "aedis-ui"]) {
      const printed = await run("node", [path.join(names, "node_modules", name, "bin", "aedis.js"), "--version"], names, { capture: true });
      if (printed !== version) fail(`${name} printed ${JSON.stringify(printed)}, expected ${version}`);
    }
    await run("node", [path.join(names, "node_modules", "create-aedis", "bin", "create-aedis.js"), ...from, "--yes"], names);
    if (!existsSync(path.join(names, "aedis.json"))) fail("create-aedis did not run init");
    console.log(`\nsmoke: aedis-cli, aedis-ui and create-aedis@${version} resolve @aedis/cli@${version} and run`);
  } finally {
    rmSync(names, { recursive: true, force: true, maxRetries: 3 });
  }
} finally {
  server.close();
  rmSync(scratch, { recursive: true, force: true, maxRetries: 3 });
}
