import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * An example's source, read from examples/ when the page is built, so the Code tab is never written by hand. Imports
 * point at the folders `aedis init` uses (aedis.json aliases), as a reader would paste it.
 */
export function exampleSource(file: string) {
  return readFileSync(join(process.cwd(), "examples", `${file}.tsx`), "utf8")
    .replaceAll("@/registry/aedis/ui/", "@/components/ui/")
    .replaceAll("@/registry/aedis/lib/", "@/lib/")
    .replaceAll("@/registry/aedis/hooks/", "@/hooks/")
    .trimEnd();
}
