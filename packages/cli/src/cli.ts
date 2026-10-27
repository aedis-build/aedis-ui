import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { decodePreset, presetBlocks, presetChoices, presetItems, presetLevels, presetTheme } from "../../../apps/www/content/preset";
import { themeToCss } from "../../../apps/www/registry/aedis/lib/custom-theme";
import { CONFIG_FILE, defaultConfig, isRelease, readConfig, type AedisConfig } from "./config";
import { detectPackageManager, installCommand, pickVersions } from "./deps";
import { lineDiff } from "./diff";
import { lintMessages, lintRegistry } from "./lint";
import { insideProject } from "./paths";
import { githubRegistry, releaseSource, resolveItems, urlSource, type ItemSource } from "./registry";
import { serve } from "./mcp";
import { themeImport } from "./theme";
import { planFiles } from "./transform";
import type { SignatureCheck } from "./verify";

export const VERSION = "0.1.2";

/** What `aedis init` installs: config, theme tokens, cn and the security primitives. */
export const INIT_ITEMS = ["theme", "utils", "untrusted", "api", "security-headers"];

export type Io = {
  cwd: string;
  fetcher: typeof fetch;
  check: SignatureCheck;
  /** Runs the package manager; returns its exit code. */
  spawn: (command: string, args: string[], options: { cwd: string; env: Record<string, string> }) => number;
  /** Asks yes/no; false when there is no terminal. */
  confirm: (question: string) => Promise<boolean>;
  log: (line: string) => void;
  now?: number;
  /** For `aedis mcp`: stdin as lines, and raw stdout (log would mix in other output). */
  stdin?: () => AsyncIterable<string>;
  stdout?: (text: string) => void;
};

type Flags = { registry?: string; release?: string; preset?: string; yes: boolean; overwrite: boolean; allowUnverified: boolean; cwd?: string };

const HELP = `aedis ${VERSION}: Aedis UI components with verified provenance

Usage
  npx @aedis/cli@${VERSION} init              config, theme, cn and the security primitives
  npx @aedis/cli@${VERSION} init --preset <id>  the same, plus the choices made on ui.aedis.build/create
  npx @aedis/cli@${VERSION} add <item...>     add items and their dependencies
  npx @aedis/cli@${VERSION} diff [item...]    compare local copies with the registry
  npx @aedis/cli@${VERSION} theme import <file.json>
  npx @aedis/cli@${VERSION} lint [registry.json]  check a registry's items against the Aedis rules
  npx @aedis/cli@${VERSION} mcp               read-only docs server for coding agents (MCP, stdio)

Options
  --release vX.Y.Z   registry release (default: aedis.json, or v${VERSION} on init)
  --registry github:<owner>/<repo>@<tag>
                     a third-party registry, verified like Aedis UI: Sigstore signature and SLSA
                     provenance from that repository's release workflow, built there or by the
                     Aedis platform's release workflow
  --registry <url> --allow-unverified
                     any other registry, e.g. a local branch; refused unless you allow it
  --yes, -y          do not ask before writing
  --overwrite        replace local copies that differ from the registry
  --cwd <dir>        project root (default: current directory)`;

function parse(argv: string[]) {
  const flags: Flags = { yes: false, overwrite: false, allowUnverified: false };
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--yes" || a === "-y") flags.yes = true;
    else if (a === "--overwrite") flags.overwrite = true;
    else if (a === "--allow-unverified") flags.allowUnverified = true;
    else if (a === "--registry" || a === "--release" || a === "--cwd" || a === "--preset") {
      const value = argv[++i];
      if (!value) throw new Error(`${a} needs a value`);
      flags[a.slice(2) as "registry" | "release" | "cwd" | "preset"] = value;
    } else if (a.startsWith("-")) throw new Error(`unknown option ${a}`);
    else rest.push(a);
  }
  return { flags, rest };
}

async function source(config: AedisConfig, flags: Flags, io: Io): Promise<ItemSource> {
  if (flags.registry) {
    const github = githubRegistry(flags.registry);
    if (github) {
      io.log(`verifying ${github.repository} ${github.release}…`);
      return releaseSource(github.release, { fetcher: io.fetcher, check: io.check, repository: github.repository, namespace: github.namespace });
    }
    if (!flags.allowUnverified) {
      throw new Error(`refusing ${flags.registry}: it is not a signed release. Use github:<owner>/<repo>@<tag> for a verified registry, or pass --allow-unverified to install from it anyway`);
    }
    io.log(`warning: ${flags.registry} is not a signed release; provenance is NOT verified.`);
    return urlSource(flags.registry, { fetcher: io.fetcher });
  }
  const release = flags.release ?? config.release;
  if (!isRelease(release)) throw new Error(`invalid release ${release}`);
  io.log(`verifying ${release}…`);
  return releaseSource(release, { fetcher: io.fetcher, check: io.check });
}

async function add(names: string[], config: AedisConfig, flags: Flags, io: Io, root: string) {
  if (!names.length) throw new Error("add: name at least one item, e.g. aedis add button");
  const from = await source(config, flags, io);
  const items = await resolveItems(names, from);
  const files = planFiles(items, config, root);
  const status = files.map((f) => {
    if (!existsSync(f.absolute)) return "create" as const;
    return readFileSync(f.absolute, "utf8") === f.content ? ("unchanged" as const) : ("differs" as const);
  });
  const conflicts = files.filter((_f, i) => status[i] === "differs");
  if (conflicts.length && !flags.overwrite) {
    for (const f of conflicts) io.log(`  local copy differs: ${f.relative}`);
    throw new Error("local copies differ from the registry: run aedis diff, send changes upstream, or pass --overwrite");
  }
  io.log(`from ${from.label}:`);
  files.forEach((f, i) => io.log(`  ${status[i] === "create" ? "create   " : status[i] === "differs" ? "overwrite" : "unchanged"} ${f.relative}`));

  const deps = [...new Set(items.flatMap((i) => i.dependencies))];
  const specs = deps.length ? await pickVersions(deps, { fetcher: io.fetcher, now: io.now }) : [];
  if (specs.length) io.log(`npm dependencies (exact, at least 7 days old): ${specs.join(" ")}`);

  if (!flags.yes && !(await io.confirm("Write these files?"))) {
    io.log("nothing written");
    return 1;
  }
  files.forEach((f, i) => {
    if (status[i] === "unchanged") return;
    mkdirSync(path.dirname(f.absolute), { recursive: true });
    writeFileSync(f.absolute, f.content);
  });
  if (specs.length) {
    const pm = detectPackageManager(root);
    const { command, args, env } = installCommand(pm, specs);
    io.log(`$ ${command} ${args.join(" ")}`);
    const code = io.spawn(command, args, { cwd: root, env });
    if (code !== 0) throw new Error(`${command} exited with ${code}`);
  }
  io.log(`added ${items.map((i) => i.name).join(", ")}`);
  return 0;
}

async function diff(names: string[], config: AedisConfig, flags: Flags, io: Io, root: string) {
  const from = await source(config, flags, io);
  const items = await resolveItems(names.length ? names : INIT_ITEMS, from);
  let changed = 0;
  for (const f of planFiles(items, config, root)) {
    if (!existsSync(f.absolute)) {
      if (names.length) io.log(`missing  ${f.relative}`);
      continue;
    }
    const d = lineDiff(readFileSync(f.absolute, "utf8"), f.content);
    if (!d) continue;
    changed++;
    io.log(`--- ${f.relative} (local)\n+++ ${f.relative} (${from.label})\n${d}`);
  }
  io.log(changed ? `${changed} file(s) differ. Local copies are not meant to be edited in place: send the change upstream.` : "up to date");
  return changed ? 1 : 0;
}

/** Runs the CLI; returns the exit code. Every side effect goes through `io`, so it can be tested end to end. */
export async function run(argv: string[], io: Io): Promise<number> {
  try {
    if (argv.includes("--help") || argv.includes("-h")) return io.log(HELP), 0;
    if (argv.includes("--version")) return io.log(VERSION), 0;
    const { flags, rest } = parse(argv);
    const [command, ...args] = rest;
    if (!command || command === "help") return io.log(HELP), 0;
    if (command === "version") return io.log(VERSION), 0;
    if (command === "mcp") {
      if (!io.stdin || !io.stdout) throw new Error("mcp: needs stdin and stdout");
      await serve(io.stdin(), io.stdout, io.fetcher, VERSION);
      return 0;
    }
    const root = path.resolve(io.cwd, flags.cwd ?? ".");
    if (command === "lint") {
      const file = path.resolve(root, args[0] ?? "registry.json");
      const dir = path.dirname(file);
      const findings = lintRegistry(JSON.parse(readFileSync(file, "utf8")), (p) => readFileSync(insideProject(dir, p), "utf8"));
      for (const f of findings) io.log(`  ${f.item} ${f.file}:${f.line} ${lintMessages[f.rule]} (${f.rule}): ${f.text}`);
      io.log(findings.length ? `${findings.length} finding(s); exempt an item only with a reason in meta.aedisLint` : "aedis lint: every item passes");
      return findings.length ? 1 : 0;
    }
    if (!existsSync(path.join(root, "package.json"))) throw new Error(`${root} has no package.json; run inside your app`);

    if (command === "init") {
      const config = readConfig(root) ?? defaultConfig(root, flags.release ?? `v${VERSION}`);
      if (!isRelease(config.release)) throw new Error(`invalid release ${config.release}`);
      // A preset only names known choices: nothing in it runs, and it is shown before anything is written.
      const decoded = flags.preset === undefined ? null : decodePreset(flags.preset);
      if (decoded && !decoded.ok) throw new Error(`preset refused: ${decoded.error}`);
      const preset = decoded?.ok ? decoded.preset : null;
      if (preset) {
        const shown = {
          framework: presetChoices.framework[preset.framework],
          theme: presetChoices.theme[preset.theme],
          radius: presetChoices.radius[preset.radius],
          motion: presetChoices.motion[preset.motion],
          security: presetChoices.level[preset.level],
          blocks: preset.blocks.map((b) => presetBlocks[b].label),
        };
        io.log(`preset ${flags.preset}:
${JSON.stringify(shown, null, 2)}`);
      }
      const code = await add([...INIT_ITEMS, ...(preset ? presetItems(preset) : [])], config, flags, io, root);
      const theme = code === 0 && preset ? presetTheme(preset) : null;
      if (theme) {
        const out = insideProject(root, `${config.paths.styles}/aedis-custom-theme.css`);
        mkdirSync(path.dirname(out), { recursive: true });
        writeFileSync(out, `/* Generated by aedis init --preset ${flags.preset}. Do not edit; run it again or use aedis theme import. */
${themeToCss(theme)}
`);
        io.log(`wrote ${path.relative(root, out)}; import it after aedis-theme.css`);
      }
      if (code === 0 && preset) io.log(`${presetChoices.level[preset.level]}: the platform adds ${presetLevels[preset.level].platform}`);
      if (code === 0 && !existsSync(path.join(root, CONFIG_FILE))) {
        writeFileSync(insideProject(root, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`);
        io.log(`wrote ${CONFIG_FILE} (release ${config.release}); import ${config.paths.styles}/aedis-theme.css after tailwindcss in your global CSS`);
      }
      return code;
    }

    if (command === "theme" && args[0] === "import") {
      if (!args[1]) throw new Error("theme import: give the theme's JSON file");
      const config = readConfig(root) ?? defaultConfig(root, `v${VERSION}`);
      const input = insideProject(root, path.relative(root, path.resolve(io.cwd, args[1])));
      const result = themeImport(readFileSync(input, "utf8"), path.basename(input));
      if (!result.ok) {
        for (const e of result.errors) io.log(`  ${e}`);
        throw new Error("theme refused");
      }
      const out = insideProject(root, `${config.paths.styles}/aedis-custom-theme.css`);
      mkdirSync(path.dirname(out), { recursive: true });
      writeFileSync(out, result.css);
      io.log(`wrote ${path.relative(root, out)} for "${result.name}"; import it after aedis-theme.css`);
      return 0;
    }

    const config = readConfig(root);
    if (!config) throw new Error(`no ${CONFIG_FILE}: run aedis init first`);
    if (command === "add") return await add(args, config, flags, io, root);
    if (command === "diff") return await diff(args, config, flags, io, root);
    throw new Error(`unknown command ${command}; see aedis --help`);
  } catch (error) {
    io.log(`error: ${(error as Error).message}`);
    return 1;
  }
}
