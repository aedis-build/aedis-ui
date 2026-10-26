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
    // Geometry, not pixels (#118): runs once and switches the themes itself.
    { name: "layout", testMatch: "layout.spec.ts", use: { colorScheme: "light" } },
    // Behaviour on the built site: the live micro-frontends demo (#135), chart motion (#136) and every *.behaviour.spec.ts,
    // which drive components the way a person does (the usability retest of 2026-10-24, #154–#163).
    { name: "behaviour", testMatch: ["mf-demo.spec.ts", "chart-motion.spec.ts", "share.spec.ts", "discovery.spec.ts", "*.behaviour.spec.ts"], use: { colorScheme: "light" } },
    { name: "light", testIgnore: ["layout.spec.ts", "mf-demo.spec.ts", "chart-motion.spec.ts", "share.spec.ts", "discovery.spec.ts", "*.behaviour.spec.ts"], use: { colorScheme: "light" } },
    { name: "dark", testIgnore: ["layout.spec.ts", "mf-demo.spec.ts", "chart-motion.spec.ts", "share.spec.ts", "discovery.spec.ts", "*.behaviour.spec.ts"], use: { colorScheme: "dark" } },
    // The third theme is chosen by data-theme, not by a media feature: the spec sets it.
    { name: "brand", testIgnore: ["layout.spec.ts", "mf-demo.spec.ts", "chart-motion.spec.ts", "share.spec.ts", "discovery.spec.ts", "*.behaviour.spec.ts"], use: { colorScheme: "light" } },
    { name: "reduced-motion", testIgnore: ["layout.spec.ts", "mf-demo.spec.ts", "chart-motion.spec.ts", "share.spec.ts", "discovery.spec.ts", "*.behaviour.spec.ts"], use: { colorScheme: "light", reducedMotion: "reduce" } },
    // Browsers cannot emulate prefers-reduced-transparency: the spec sets data-reduced-transparency, which the theme honours the same way.
    { name: "reduced-transparency", testIgnore: ["layout.spec.ts", "mf-demo.spec.ts", "chart-motion.spec.ts", "share.spec.ts", "discovery.spec.ts", "*.behaviour.spec.ts"], use: { colorScheme: "light" } },
    { name: "high-contrast", testIgnore: ["layout.spec.ts", "mf-demo.spec.ts", "chart-motion.spec.ts", "share.spec.ts", "discovery.spec.ts", "*.behaviour.spec.ts"], use: { colorScheme: "light", contrast: "more" } },
  ],
});
