import { defineConfig, devices } from "@playwright/test";

// Visual regression for the theme (#40). Baselines come only from CI, inside the Playwright container pinned in
// .github/workflows/visual.yml, so fonts and rendering never depend on a developer's machine.
export default defineConfig({
  testDir: "visual",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}-{platform}{ext}",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  expect: { toHaveScreenshot: { animations: "disabled", caret: "hide", maxDiffPixelRatio: 0.001 } },
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:4173", viewport: { width: 1280, height: 800 } },
  webServer: { command: "node visual/serve.mjs", url: "http://127.0.0.1:4173/", reuseExistingServer: !process.env.CI },
  projects: [
    { name: "light", use: { colorScheme: "light" } },
    { name: "dark", use: { colorScheme: "dark" } },
    { name: "reduced-motion", use: { colorScheme: "light", reducedMotion: "reduce" } },
    // Browsers cannot emulate prefers-reduced-transparency: the spec sets data-reduced-transparency, which the theme honours the same way.
    { name: "reduced-transparency", use: { colorScheme: "light" } },
    { name: "high-contrast", use: { colorScheme: "light", contrast: "more" } },
  ],
});
