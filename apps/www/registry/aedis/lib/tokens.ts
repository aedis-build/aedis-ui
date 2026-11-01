/**
 * The Aedis UI default theme as typed data. `registry/aedis/styles/theme.css` is generated from this file
 * (`pnpm theme`); never edit the CSS by hand. Values come from the Aedis design system.
 */

export const themeNames = ["light", "dark", "brand"] as const;
export type ThemeName = (typeof themeNames)[number];

type PerTheme = Record<ThemeName, string>;

/** Every color has a role, not a hue. The CSS variable is `--<name>` and the Tailwind color is `<name>`. */
export const colors = {
  background: { light: "#f6f7f9", dark: "#0d1015", brand: "#f5f1e8" },
  surface: { light: "#ffffff", dark: "#161a21", brand: "#fbf8f1" },
  "surface-raised": { light: "#ffffff", dark: "#1d222b", brand: "#ffffff" },
  muted: { light: "#eef0f4", dark: "#232833", brand: "#ece5d5" },
  foreground: { light: "#161b26", dark: "#eceff4", brand: "#1a2740" },
  "muted-foreground": { light: "#5c6475", dark: "#9ba4b4", brand: "#5a6276" },
  border: { light: "#dce0e7", dark: "#2c323d", brand: "#ddd4c2" },
  "border-control": { light: "#8a92a3", dark: "#646d80", brand: "#8a8270" },
  hairline: { light: "rgba(22,27,38,0.08)", dark: "rgba(255,255,255,0.08)", brand: "rgba(26,39,64,0.10)" },
  primary: { light: "#2457d6", dark: "#3565e8", brand: "#1a2740" },
  "primary-foreground": { light: "#ffffff", dark: "#ffffff", brand: "#ffffff" },
  secondary: { light: "#ffffff", dark: "#161a21", brand: "#fbf8f1" },
  "secondary-foreground": { light: "#161b26", dark: "#eceff4", brand: "#1a2740" },
  link: { light: "#2457d6", dark: "#7aa2ff", brand: "#1a2740" },
  accent: { light: "#2457d6", dark: "#7aa2ff", brand: "#c8a24c" },
  "accent-foreground": { light: "#ffffff", dark: "#0d1015", brand: "#1a2740" },
  "accent-soft": { light: "#e8eefc", dark: "#1b2742", brand: "#f3ebd6" },
  ring: { light: "#2457d6", dark: "#7aa2ff", brand: "#1a2740" },
  success: { light: "#18794e", dark: "#3dd68c", brand: "#18794e" },
  warning: { light: "#a35200", dark: "#f5a524", brand: "#a35200" },
  destructive: { light: "#c9302c", dark: "#ff6369", brand: "#c9302c" },
  "destructive-solid": { light: "#c9302c", dark: "#c93a3f", brand: "#c9302c" },
  "destructive-foreground": { light: "#ffffff", dark: "#ffffff", brand: "#ffffff" },
  "material-thin": { light: "rgba(255,255,255,0.55)", dark: "rgba(22,26,33,0.55)", brand: "rgba(251,248,241,0.55)" },
  "material-regular": { light: "rgba(255,255,255,0.72)", dark: "rgba(22,26,33,0.72)", brand: "rgba(251,248,241,0.72)" },
  "material-thick": { light: "rgba(255,255,255,0.86)", dark: "rgba(22,26,33,0.86)", brand: "rgba(251,248,241,0.86)" },
  "material-edge": { light: "rgba(255,255,255,0.60)", dark: "rgba(255,255,255,0.08)", brand: "rgba(255,255,255,0.60)" },
  scrim: { light: "rgba(13,16,21,0.32)", dark: "rgba(0,0,0,0.55)", brand: "rgba(26,39,64,0.32)" },
  "on-media": { light: "#ffffff", dark: "#ffffff", brand: "#ffffff" },
  "media-scrim": { light: "rgba(0,0,0,0.6)", dark: "rgba(0,0,0,0.6)", brand: "rgba(0,0,0,0.6)" },
  "media-scrim-strong": { light: "rgba(0,0,0,0.8)", dark: "rgba(0,0,0,0.8)", brand: "rgba(0,0,0,0.8)" },
  "media-mask": { light: "#000000", dark: "#000000", brand: "#000000" },
  "chart-1": { light: "#2457d6", dark: "#7aa2ff", brand: "#1a2740" },
  "chart-2": { light: "#0f8577", dark: "#3dd6c4", brand: "#8a6a1f" },
  "chart-3": { light: "#b25e09", dark: "#f5a524", brand: "#2f6f73" },
  "chart-4": { light: "#8e4ec6", dark: "#c79bff", brand: "#a1452b" },
  "chart-5": { light: "#d1366b", dark: "#ff7aa8", brand: "#6b4c9a" },
} satisfies Record<string, PerTheme>;
export type ColorName = keyof typeof colors;

export const colorUsage: Record<ColorName, string> = {
  background: "Page background.",
  surface: "Cards, panels and fields on the background.",
  "surface-raised": "Popovers, menus and dialogs. In dark it is lighter instead of relying on shadow alone.",
  muted: "Subtle fill: tracks, zebra rows, item hover.",
  foreground: "Body text.",
  "muted-foreground": "Secondary text and captions; 4.5:1 on background, surface and muted.",
  border: "Dividers and decorative card outlines. Not a control outline.",
  "border-control": "Outline of fields, checkboxes and radios: 3:1 on surface (WCAG 1.4.11).",
  hairline: "1 px translucent line between surfaces.",
  primary: "The one main action per area, and selection.",
  "primary-foreground": "Text and icons on primary.",
  secondary: "Secondary actions (surface with a hairline).",
  "secondary-foreground": "Text on secondary.",
  link: "Links in running text, always underlined.",
  accent: "Attention: counters, pending items, active indicator.",
  "accent-foreground": "Text on accent.",
  "accent-soft": "Selected and active item fill.",
  ring: "Outer focus ring; always paired with an inner ring in surface.",
  success: "Success text and icons.",
  warning: "Warning before a problem.",
  destructive: "Errors and destructive actions in text and icons.",
  "destructive-solid": "Destructive button fill. Never looks like primary.",
  "destructive-foreground": "Text on destructive-solid.",
  "material-thin": "Translucent material for chips and floating controls (with blur-thin).",
  "material-regular": "Header, toolbar, popover (with blur-regular).",
  "material-thick": "Sheet, sidebar, large surfaces (with blur-thick).",
  "material-edge": "Light top edge of a material.",
  scrim: "Dims the page behind a modal.",
  "on-media": "Text over a photograph, always on a media scrim. The same in every theme: the photograph does not change with it.",
  "media-scrim": "Darkens a photograph under text: on-media is 4.5:1 on it even over a white picture.",
  "media-scrim-strong": "The dense end of a gradient scrim, where the text sits.",
  "media-mask": "The opaque layer a text mask cuts its letters from: multiplied over a photograph or film, only the letters show it.",
  "chart-1": "First chart series; every chart color is 3:1 on surface and background.",
  "chart-2": "Second chart series.",
  "chart-3": "Third chart series.",
  "chart-4": "Fourth chart series.",
  "chart-5": "Fifth chart series.",
};

/** Two layers: one short and defined, one long and soft. Tailwind: `shadow-<name>`. */
export const shadows = {
  "elevation-1": {
    light: "0 1px 1px rgba(16,24,40,0.04), 0 1px 2px rgba(16,24,40,0.06)",
    dark: "0 1px 2px rgba(0,0,0,0.40)",
    brand: "0 1px 1px rgba(26,39,64,0.05), 0 1px 2px rgba(26,39,64,0.07)",
  },
  "elevation-2": {
    light: "0 2px 4px rgba(16,24,40,0.06), 0 4px 12px rgba(16,24,40,0.08)",
    dark: "0 2px 6px rgba(0,0,0,0.45), 0 6px 16px rgba(0,0,0,0.35)",
    brand: "0 2px 4px rgba(26,39,64,0.06), 0 4px 12px rgba(26,39,64,0.09)",
  },
  "elevation-3": {
    light: "0 4px 8px rgba(16,24,40,0.06), 0 12px 28px rgba(16,24,40,0.12)",
    dark: "0 4px 10px rgba(0,0,0,0.5), 0 14px 32px rgba(0,0,0,0.45)",
    brand: "0 4px 8px rgba(26,39,64,0.07), 0 12px 28px rgba(26,39,64,0.13)",
  },
  "elevation-4": {
    light: "0 8px 16px rgba(16,24,40,0.08), 0 24px 56px rgba(16,24,40,0.18)",
    dark: "0 8px 20px rgba(0,0,0,0.55), 0 28px 64px rgba(0,0,0,0.55)",
    brand: "0 8px 16px rgba(26,39,64,0.09), 0 24px 56px rgba(26,39,64,0.19)",
  },
} satisfies Record<string, PerTheme>;
export type ShadowName = keyof typeof shadows;

export const fonts = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif',
  mono: 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace',
  /** Headings; the sans unless a theme gives the display its own family. */
  display: "var(--font-sans)",
};

type TypeStyle = { size: string; lineHeight: number; tracking: string; weight: number };

/** Tracking tightens and leading drops as size grows. Tailwind: `text-<name>`. */
export const typeScale = {
  display: { size: "3rem", lineHeight: 1.05, tracking: "-0.025em", weight: 700 },
  "title-1": { size: "2.125rem", lineHeight: 1.12, tracking: "-0.02em", weight: 700 },
  "title-2": { size: "1.625rem", lineHeight: 1.18, tracking: "-0.015em", weight: 600 },
  "title-3": { size: "1.25rem", lineHeight: 1.25, tracking: "-0.01em", weight: 600 },
  headline: { size: "1.0625rem", lineHeight: 1.35, tracking: "-0.005em", weight: 600 },
  body: { size: "1rem", lineHeight: 1.5, tracking: "0em", weight: 400 },
  callout: { size: "0.9375rem", lineHeight: 1.45, tracking: "0em", weight: 400 },
  footnote: { size: "0.8125rem", lineHeight: 1.4, tracking: "0.005em", weight: 400 },
  caption: { size: "0.75rem", lineHeight: 1.35, tracking: "0.01em", weight: 500 },
  code: { size: "0.875rem", lineHeight: 1.6, tracking: "0em", weight: 400 },
} satisfies Record<string, TypeStyle>;

/** Concentric radii: the inner radius is the outer one minus the padding between them. Tailwind: `rounded-<name>`. */
export const radii = { xs: "6px", sm: "8px", md: "12px", lg: "16px", xl: "22px" };

/** backdrop-filter radius of each material. */
export const blurs = { thin: "12px", regular: "20px", thick: "28px", materialize: "6px" };

/** Long, soft entrances; short exits. */
export const durations = {
  press: "140ms",
  release: "520ms",
  fast: "200ms",
  base: "380ms",
  spring: "560ms",
  sheet: "700ms",
  stagger: "50ms",
  // Page-load entrance: a slow rise, one block after another.
  enter: "900ms",
  "enter-stagger": "90ms",
};

/** Springs sampled with linear(): no dependency. Tailwind: `ease-<name>`. */
export const easings = {
  out: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  cinematic: "cubic-bezier(0.16, 1, 0.3, 1)",
  "spring-critical": "linear(0, 0.191 10%, 0.475 20%, 0.692 30%, 0.829 40%, 0.908 50%, 0.952 60%, 0.976 70%, 0.988 80%, 0.994 90%, 1)",
  "spring-bouncy": "linear(0, 0.208 10%, 0.537 20%, 0.787 30%, 0.93 40%, 0.993 50%, 1.013 60%, 1.014 70%, 1.01 80%, 1.005 90%, 1)",
};

export const scales = { press: "0.96", materialize: "0.86", recede: "0.95" };

const text = ["background", "surface", "surface-raised", "muted"] as const;

/** [foreground, background, minimum ratio] every theme must pass: text 4.5:1, control outlines 3:1 (WCAG 1.4.3, 1.4.11). */
export const contrastPairs: [ColorName, ColorName, number][] = [
  ...text.flatMap((bg): [ColorName, ColorName, number][] => [
    ["foreground", bg, 4.5],
    ["muted-foreground", bg, 4.5],
  ]),
  ["primary-foreground", "primary", 4.5],
  ["secondary-foreground", "secondary", 4.5],
  ["accent-foreground", "accent", 4.5],
  ["foreground", "accent-soft", 4.5],
  ["destructive-foreground", "destructive-solid", 4.5],
  // Composited over white: the worst photograph there is.
  ["on-media", "media-scrim", 4.5],
  ["link", "surface", 4.5],
  ["link", "background", 4.5],
  ["destructive", "surface", 4.5],
  ["success", "surface", 4.5],
  ["warning", "surface", 4.5],
  ["border-control", "surface", 3],
  // The focus ring is how a keyboard user finds their place: 3:1 on what it is drawn on (WCAG 1.4.11, #157).
  ["ring", "surface", 3],
  ["ring", "background", 3],
  ["ring", "muted", 3],
  ["foreground", "material-thick", 4.5],
  // Chart marks are graphics: 3:1 on what they are drawn on (WCAG 1.4.11).
  ...(["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const).flatMap((c): [ColorName, ColorName, number][] => [
    [c, "surface", 3],
    [c, "background", 3],
  ]),
];
