import { blurs, colors, durations, easings, fonts, radii, scales, shadows, typeScale, type ThemeName } from "./tokens";

const block = (selector: string, lines: string[], indent = "") =>
  `${indent}${selector} {\n${lines.map((l) => `${indent}  ${l}`).join("\n")}\n${indent}}`;

const themeVars = (theme: ThemeName) => [
  `color-scheme: ${theme === "dark" ? "dark" : "light"};`,
  ...Object.entries(colors).map(([name, v]) => `--${name}: ${v[theme]};`),
  ...Object.entries(shadows).map(([name, v]) => `--${name}: ${v[theme]};`),
];

const shared = [
  `--font-sans: ${fonts.sans};`,
  `--font-mono: ${fonts.mono};`,
  ...Object.entries(typeScale).flatMap(([name, s]) => [
    `--text-${name}: ${s.size};`,
    `--text-${name}--line-height: ${s.lineHeight};`,
    `--text-${name}--letter-spacing: ${s.tracking};`,
    `--text-${name}--font-weight: ${s.weight};`,
  ]),
  ...Object.entries(radii).map(([name, v]) => `--radius-${name}: ${v};`),
  ...Object.entries(blurs).map(([name, v]) => `--blur-${name}: ${v};`),
  ...Object.entries(durations).map(([name, v]) => `--duration-${name}: ${v};`),
  ...Object.entries(easings).map(([name, v]) => `--ease-${name}: ${v};`),
  ...Object.entries(scales).map(([name, v]) => `--${name}-scale: ${v};`),
];

// Code highlighting (shiki's css-variables theme) reuses text roles, so it follows every theme and its contrast checks.
export const syntax: Record<string, string> = {
  foreground: "foreground",
  background: "surface",
  "token-keyword": "link",
  "token-function": "foreground",
  "token-parameter": "foreground",
  "token-constant": "warning",
  "token-string": "success",
  "token-string-expression": "success",
  "token-comment": "muted-foreground",
  "token-punctuation": "muted-foreground",
  "token-link": "link",
};

const mapped = [
  ...Object.keys(colors).map((name) => `--color-${name}: var(--${name});`),
  ...Object.keys(shadows).map((name) => `--shadow-${name}: var(--${name});`),
];

// Utilities are written by hand: they compose the tokens above and are the only place motion lives.
const utilities = String.raw`
/* Keyboard focus: inner ring in the surface color, outer ring in --ring. Composes with elevation shadows. */
@utility focus-ring {
  outline: none;
  &:focus-visible {
    @apply ring-2 ring-ring ring-offset-2 ring-offset-surface;
  }
}

/* Sinks on pointer-down, comes back on a soft spring. */
@utility press {
  transition:
    scale var(--duration-release) var(--ease-spring-bouncy),
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
  &:active:not(:disabled, [data-disabled], [aria-disabled="true"]) {
    scale: var(--press-scale);
    transition-duration: var(--duration-press);
    transition-timing-function: var(--ease-cinematic);
  }
}

/* Popovers, menus and dialogs grow out of their trigger (Base UI sets --transform-origin); exits are short. */
@utility materialize {
  transform-origin: var(--transform-origin, center);
  transition:
    scale var(--duration-spring) var(--ease-spring-critical),
    opacity var(--duration-base) var(--ease-cinematic),
    filter var(--duration-base) var(--ease-cinematic);
  &[data-starting-style],
  &[data-ending-style] {
    scale: var(--materialize-scale);
    opacity: 0;
    filter: blur(var(--blur-materialize));
  }
  &[data-ending-style] {
    transition-duration: var(--duration-fast);
    transition-timing-function: var(--ease-cinematic);
  }
}

/* Scrims and plain cross-fades. */
@utility fade {
  transition: opacity var(--duration-base) var(--ease-cinematic);
  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
  }
  &[data-ending-style] {
    transition-duration: var(--duration-fast);
  }
}

/* Translucent materials with a light top edge. Solid under reduced transparency (see the tokens above). */
@utility material-thin {
  background: linear-gradient(var(--material-edge), var(--material-edge)) top / 100% 1px no-repeat, var(--material-thin);
  backdrop-filter: saturate(180%) blur(var(--blur-thin));
}
@utility material-regular {
  background: linear-gradient(var(--material-edge), var(--material-edge)) top / 100% 1px no-repeat, var(--material-regular);
  backdrop-filter: saturate(180%) blur(var(--blur-regular));
}
@utility material-thick {
  background: linear-gradient(var(--material-edge), var(--material-edge)) top / 100% 1px no-repeat, var(--material-thick);
  backdrop-filter: saturate(180%) blur(var(--blur-thick));
}

/* Line-by-line reveal (code-block animated): the text is in the DOM from the start, only its paint is clipped. */
@utility reveal-line {
  clip-path: inset(0 100% 0 0);
  opacity: 0;
  transition:
    clip-path var(--duration-base) var(--ease-cinematic),
    opacity var(--duration-base) var(--ease-cinematic);
  &[data-shown] {
    clip-path: inset(0 0 0 0);
    opacity: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

/* Blinking text cursor; never under reduced motion. */
@utility caret {
  animation: caret 1s steps(1) infinite;
  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
}
@keyframes caret {
  50% {
    opacity: 0;
  }
}

/* Where scrolling content meets floating chrome: a fade instead of a divider line. */
@utility scroll-fade-y {
  mask-image: linear-gradient(to bottom, transparent, black 1rem, black calc(100% - 1rem), transparent);
}
@utility scroll-edge {
  &::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    top: 100%;
    height: 1rem;
    pointer-events: none;
    background: linear-gradient(var(--background), transparent);
  }
}`;

/** The theme stylesheet: tokens for the three themes, the Tailwind mapping, accessibility fallbacks and utilities. */
export function themeCss() {
  return [
    "/* Generated from registry/aedis/lib/tokens.ts by `pnpm theme`. Do not edit by hand. */",
    "",
    block("@theme static", shared),
    "",
    block("@theme inline", mapped),
    "",
    block(":root", [...themeVars("light"), ...Object.entries(syntax).map(([k, v]) => `--syntax-${k}: var(--${v});`)]),
    "",
    "/* Dark follows the system unless a theme is chosen with data-theme on <html>. */",
    `@media (prefers-color-scheme: dark) {\n${block(":root:not([data-theme])", themeVars("dark"), "  ")}\n}`,
    "",
    block(':root[data-theme="dark"]', themeVars("dark")),
    "",
    "/* The Aedis brand (navy, gold, cream) is an extra theme, never the default. */",
    block(':root[data-theme="brand"]', themeVars("brand")),
    "",
    `@media (prefers-reduced-transparency: reduce) {\n${block(":root:root", [
      "--material-thin: var(--surface);",
      "--material-regular: var(--surface);",
      "--material-thick: var(--surface);",
      "--material-edge: transparent;",
      "--blur-thin: 0px;",
      "--blur-regular: 0px;",
      "--blur-thick: 0px;",
    ], "  ")}\n}`,
    "",
    `@media (prefers-contrast: more) {\n${block(":root:root", ["--border: var(--border-control);", "--hairline: var(--border-control);"], "  ")}\n}`,
    "",
    "/* Reduced motion: slides, scale, blur and bounce become a short cross-fade. */",
    `@media (prefers-reduced-motion: reduce) {\n${block(":root:root", [
      "--press-scale: 1;",
      "--materialize-scale: 1;",
      "--recede-scale: 1;",
      "--blur-materialize: 0px;",
      "--duration-release: var(--duration-fast);",
      "--duration-base: var(--duration-fast);",
      "--duration-spring: var(--duration-fast);",
      "--duration-sheet: var(--duration-fast);",
      "--duration-stagger: 0ms;",
      "--ease-spring-critical: ease;",
      "--ease-spring-bouncy: ease;",
    ], "  ")}\n}`,
    utilities,
    "",
  ].join("\n");
}
