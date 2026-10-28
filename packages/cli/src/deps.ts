import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type PackageManager = "npm" | "pnpm" | "yarn" | "yarn1" | "bun";

const FROM_FIELD = /^(npm|pnpm|yarn|bun)@(\d+)/;

/** The package manager a package.json declares in `packageManager` ("pnpm@9.1.0"), if any. */
function declared(json: string): PackageManager | null {
  try {
    const match = FROM_FIELD.exec(String((JSON.parse(json) as { packageManager?: unknown }).packageManager ?? ""));
    if (!match) return null;
    return match[1] === "yarn" ? (Number(match[2]) >= 2 ? "yarn" : "yarn1") : (match[1] as PackageManager);
  } catch {
    return null;
  }
}

/**
 * The package manager the project uses. From `root` up to the folder that holds `.git` (or the filesystem root),
 * the first folder with a lockfile, a pnpm-workspace.yaml or a package.json `packageManager` decides: an app inside a
 * workspace installs with the workspace's manager. npm only when nothing up the tree says otherwise. Yarn 2+
 * lockfiles start with __metadata.
 */
export function detectPackageManager(root: string, exists: (p: string) => boolean = existsSync, read: (p: string) => string = (p) => readFileSync(p, "utf8")): PackageManager {
  for (let dir = path.resolve(root); ; dir = path.dirname(dir)) {
    const at = (f: string) => path.join(dir, f);
    if (exists(at("pnpm-lock.yaml")) || exists(at("pnpm-workspace.yaml"))) return "pnpm";
    if (exists(at("bun.lock")) || exists(at("bun.lockb"))) return "bun";
    if (exists(at("yarn.lock"))) return /__metadata:/.test(read(at("yarn.lock")).slice(0, 4096)) ? "yarn" : "yarn1";
    if (exists(at("package-lock.json"))) return "npm";
    const pm = exists(at("package.json")) ? declared(read(at("package.json"))) : null;
    if (pm) return pm;
    if (exists(at(".git")) || path.dirname(dir) === dir) return "npm";
  }
}

/** Exact versions, no lifecycle scripts, whatever the package manager. */
export function installCommand(pm: PackageManager, specs: string[]): { command: string; args: string[]; env: Record<string, string> } {
  for (const spec of specs) if (!EXACT.test(spec)) throw new Error(`refused dependency spec ${spec}`);
  switch (pm) {
    case "pnpm":
      return { command: "pnpm", args: ["add", "--save-exact", "--ignore-scripts", ...specs], env: {} };
    case "bun":
      return { command: "bun", args: ["add", "--exact", "--ignore-scripts", ...specs], env: {} };
    case "yarn":
      return { command: "yarn", args: ["add", "--exact", ...specs], env: { YARN_ENABLE_SCRIPTS: "false" } };
    case "yarn1":
      return { command: "yarn", args: ["add", "--exact", "--ignore-scripts", ...specs], env: {} };
    default:
      return { command: "npm", args: ["install", "--save-exact", "--ignore-scripts", ...specs], env: {} };
  }
}

const NAME = String.raw`(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*`;
const VERSION = String.raw`\d+\.\d+\.\d+`;
const EXACT = new RegExp(`^${NAME}@${VERSION}$`);
const SPEC = new RegExp(`^(${NAME})(?:@(${VERSION}))?$`);
export const MIN_AGE_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

const compare = (a: string, b: string) => {
  const [x, y] = [a.split(".").map(Number), b.split(".").map(Number)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

/**
 * Exact versions for the items' npm dependencies, checked against the npm registry's own publish dates: a pinned
 * version younger than 7 days is refused; an unpinned one becomes the newest stable version at least 7 days old.
 */
export async function pickVersions(deps: string[], { fetcher = fetch, now = Date.now(), minAgeDays = MIN_AGE_DAYS }: { fetcher?: typeof fetch; now?: number; minAgeDays?: number } = {}) {
  const wanted = new Map<string, string | undefined>();
  for (const dep of deps) {
    const m = SPEC.exec(dep.trim());
    if (!m) throw new Error(`refused dependency ${dep}: use a name or name@x.y.z`);
    const [, name, version] = m;
    const previous = wanted.get(name);
    if (previous && version && previous !== version) throw new Error(`conflicting versions for ${name}: ${previous} and ${version}`);
    wanted.set(name, version ?? previous);
  }
  const out: string[] = [];
  for (const [name, version] of wanted) {
    const response = await fetcher(`https://registry.npmjs.org/${name.replace("/", "%2F")}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`npm registry: ${name} (${response.status})`);
    const doc = (await response.json()) as { time?: Record<string, string>; versions?: Record<string, unknown> };
    const age = (v: string) => (doc.time?.[v] ? now - Date.parse(doc.time[v]) : -1);
    if (version) {
      if (!doc.versions?.[version]) throw new Error(`npm registry: ${name}@${version} does not exist`);
      if (age(version) < minAgeDays * DAY) throw new Error(`${name}@${version} is younger than ${minAgeDays} days; wait or pin an older version`);
      out.push(`${name}@${version}`);
      continue;
    }
    const stable = Object.keys(doc.versions ?? {})
      .filter((v) => /^\d+\.\d+\.\d+$/.test(v) && age(v) >= minAgeDays * DAY)
      .sort(compare);
    const pick = stable.at(-1);
    if (!pick) throw new Error(`npm registry: no version of ${name} is ${minAgeDays} days old`);
    out.push(`${name}@${pick}`);
  }
  return out;
}
