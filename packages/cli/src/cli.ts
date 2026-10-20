import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { CONFIG_FILE, defaultConfig, isRelease, readConfig, type AedisConfig } from "./config";
import { detectPackageManager, installCommand, pickVersions } from "./deps";
import { lineDiff } from "./diff";
import { insideProject } from "./paths";
import { releaseSource, resolveItems, urlSource, type ItemSource } from "./registry";
import { themeImport } from "./theme";
import { planFiles } from "./transform";
import type { SignatureCheck } from "./verify";

export const VERSION = "0.1.0";

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
};

type Flags = { registry?: string; release?: string; yes: boolean; overwrite: boolean; cwd?: string };

const HELP = `aedis ${VERSION}: Aedis UI components with verified provenance

Usage
  npx @aedis/cli@${VERSION} init              config, theme, cn and the security primitives
  npx @aedis/cli@${VERSION} add <item...>     add items and their dependencies
  npx @aedis/cli@${VERSION} diff [item...]    compare local copies with the registry
  npx @aedis/cli@${VERSION} theme import <file.json>

Options
  --release vX.Y.Z   registry release (default: aedis.json, or v${VERSION} on init)
  --registry <url>   another registry, e.g. a local branch; NOT verified
  --yes, -y          do not ask before writing
  --overwrite        replace local copies that differ from the registry
  --cwd <dir>        project root (default: current directory)`;

function parse(argv: string[]) {
  const flags: Flags = { yes: false, overwrite: false };
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--yes" || a === "-y") flags.yes = true;
    else if (a === "--overwrite") flags.overwrite = true;
    else if (a === "--registry" || a === "--release" || a === "--cwd") {
      const value = argv[++i];
      if (!value) throw new Error(`${a} needs a value`);
      flags[a.slice(2) as "registry" | "release" | "cwd"] = value;
    } else if (a.startsWith("-")) throw new Error(`unknown option ${a}`);
    else rest.push(a);
  }
  return { flags, rest };
}

async function source(config: AedisConfig, flags: Flags, io: Io): Promise<ItemSource> {
  if (flags.registry) {
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
    const root = path.resolve(io.cwd, flags.cwd ?? ".");
    if (!existsSync(path.join(root, "package.json"))) throw new Error(`${root} has no package.json; run inside your app`);

    if (command === "init") {
      const config = readConfig(root) ?? defaultConfig(root, flags.release ?? `v${VERSION}`);
      if (!isRelease(config.release)) throw new Error(`invalid release ${config.release}`);
      const code = await add(INIT_ITEMS, config, flags, io, root);
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
