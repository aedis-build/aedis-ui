import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("../../apps/www", import.meta.url)) } },
  test: {
    environment: "node",
    globals: true,
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      // main.ts only wires real processes, network and terminal into run(); everything it calls is tested.
      exclude: ["src/main.ts"],
      reporter: ["text-summary", "cobertura"],
      thresholds: { lines: 95, branches: 85 },
    },
  },
});
