import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { insideProject } from "./paths";

export const CONFIG_FILE = "aedis.json";
export const REPOSITORY = "aedis-build/aedis-ui";

/** Where each kind of registry file goes and how imports to it are written. */
export type AedisConfig = {
  /** The registry release this project uses, e.g. "v0.1.0": installs are verified against it. */
  release: string;
  /** Directories, relative to the project root. */
  paths: { ui: string; lib: string; hooks: string; styles: string };
  /** Import aliases matching the directories (tsconfig paths). */
  aliases: { ui: string; lib: string; hooks: string };
  /**
   * What the CLI wrote, by path relative to the project: the sha256 of the bytes written, after the release was
   * verified. A local, editable record: it detects drift, it does not authenticate anything.
   */
  files?: Record<string, Receipt>;
};

export type Receipt = { sha256: string; item: string; release: string };

export const sha256 = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");

export function defaultConfig(root: string, release: string): AedisConfig {
  const src = existsSync(path.join(root, "src")) ? "src/" : "";
  return {
    release,
    paths: { ui: `${src}components/ui`, lib: `${src}lib`, hooks: `${src}hooks`, styles: `${src}styles` },
    aliases: { ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks" },
  };
}

const RELEASE = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const DIR = /^[\w./-]+$/;
const ALIAS = /^[@~\w./-]+$/;
const HASH = /^[0-9a-f]{64}$/;
const ITEM = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** Reads aedis.json and checks every field; a bad config is an error, never a guess. */
export function readConfig(root: string): AedisConfig | null {
  const file = path.join(root, CONFIG_FILE);
  if (!existsSync(file)) return null;
  const raw = JSON.parse(readFileSync(file, "utf8")) as Partial<AedisConfig>;
  const problems: string[] = [];
  if (typeof raw.release !== "string" || !RELEASE.test(raw.release)) problems.push("release must look like v1.2.3");
  for (const key of ["ui", "lib", "hooks", "styles"] as const) {
    const v = raw.paths?.[key];
    if (typeof v !== "string" || !DIR.test(v) || v.split("/").includes("..") || v.startsWith("/")) problems.push(`paths.${key} must be a relative directory`);
  }
  for (const key of ["ui", "lib", "hooks"] as const) {
    const v = raw.aliases?.[key];
    if (typeof v !== "string" || !ALIAS.test(v)) problems.push(`aliases.${key} must be an import alias`);
  }
  if (raw.files !== undefined) {
    if (!raw.files || typeof raw.files !== "object" || Array.isArray(raw.files)) problems.push("files must be an object");
    else
      for (const [file, receipt] of Object.entries(raw.files)) {
        try {
          insideProject(root, file);
        } catch (error) {
          problems.push(`files: ${(error as Error).message}`);
          continue;
        }
        const r = receipt as Partial<Receipt> | null;
        if (typeof r?.sha256 !== "string" || !HASH.test(r.sha256) || typeof r.item !== "string" || !ITEM.test(r.item) || typeof r.release !== "string" || !r.release || r.release.length > 200) {
          problems.push(`files.${file} must be { sha256, item, release }`);
        }
      }
  }
  if (problems.length) throw new Error(`${CONFIG_FILE}: ${problems.join("; ")}`);
  return raw as AedisConfig;
}

export const isRelease = (value: string) => RELEASE.test(value);
