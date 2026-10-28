import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(new URL("./test/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // The product is the registry; the docs site around it is not shipped to anyone's app.
      include: ["registry/**", "lib/**"],
      // Cobertura XML is what the Aedis Platform coverage gate reads.
      reporter: ["text-summary", "cobertura"],
      // Same bar as the .NET framework: 95 % lines, 85 % branches (aedis-platform L3 asks 85/70).
      thresholds: { lines: 85, branches: 85 },
    },
  },
});
