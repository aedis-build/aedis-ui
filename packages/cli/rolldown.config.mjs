import { fileURLToPath } from "node:url";
import { defineConfig } from "rolldown";

// One file, so `npx @aedis/cli` runs no install script and pulls only sigstore. The theme validator is the
// registry's own (apps/www), bundled in, so the CLI and the browser refuse exactly the same themes.
export default defineConfig({
  input: "src/main.ts",
  platform: "node",
  external: [/^node:/, "sigstore"],
  resolve: { alias: { "@": fileURLToPath(new URL("../../apps/www", import.meta.url)) } },
  output: { file: "dist/aedis.js", format: "esm", banner: "#!/usr/bin/env node" },
});
