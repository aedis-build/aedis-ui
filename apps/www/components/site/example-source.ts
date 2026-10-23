import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A file's source, read when the page is built, so the Code tab is never written by hand. Imports point at the folders
 * `aedis init` uses (aedis.json aliases), as a reader would paste it. `path` is relative to apps/www.
 */
export function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .replaceAll("@/registry/aedis/ui/", "@/components/ui/")
    .replaceAll("@/registry/aedis/lib/", "@/lib/")
    .replaceAll("@/registry/aedis/hooks/", "@/hooks/")
    .trimEnd();
}

/** An example in examples/, by its name without extension. */
export const exampleSource = (file: string) => source(`examples/${file}.tsx`);
