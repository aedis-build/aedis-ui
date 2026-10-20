import path from "node:path";

import type { AedisConfig } from "./config";
import { insideProject } from "./paths";
import type { RegistryItem } from "./registry";

export type PlannedFile = { item: string; relative: string; absolute: string; content: string };

/** Where a registry file goes in this project. */
export function targetOf(file: RegistryItem["files"][number], config: AedisConfig): string {
  const base = path.posix.basename(file.path.replace(/\\/g, "/"));
  switch (file.type) {
    case "registry:ui":
    case "registry:component":
      return `${config.paths.ui}/${base}`;
    case "registry:lib":
      return `${config.paths.lib}/${base}`;
    case "registry:hook":
      return `${config.paths.hooks}/${base}`;
    case "registry:file": {
      if (!file.target) throw new Error(`registry: ${file.path} has no target`);
      return file.target.replace(/^styles\//, `${config.paths.styles}/`);
    }
    default:
      throw new Error(`registry: unsupported file type ${file.type}`);
  }
}

/** Rewrites the registry's own import paths to this project's aliases. */
export function rewriteImports(content: string, config: AedisConfig) {
  return content
    .replace(/(["'])@\/registry\/aedis\/ui\//g, `$1${config.aliases.ui}/`)
    .replace(/(["'])@\/registry\/aedis\/hooks\//g, `$1${config.aliases.hooks}/`)
    .replace(/(["'])@\/registry\/aedis\/lib\//g, `$1${config.aliases.lib}/`)
    .replace(/(["'])@\/lib\//g, `$1${config.aliases.lib}/`);
}

/** Every file the items would write, with paths checked against the project root. */
export function planFiles(items: RegistryItem[], config: AedisConfig, root: string): PlannedFile[] {
  return items.flatMap((item) =>
    item.files.map((file) => {
      const relative = targetOf(file, config);
      return { item: item.name, relative, absolute: insideProject(root, relative), content: file.type === "registry:file" ? file.content : rewriteImports(file.content, config) };
    }),
  );
}
