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

/* Menu items arrive in a cascade after their popup materializes; exits have no cascade. */
@utility cascade {
  & > * {
    transition:
      opacity var(--duration-base) var(--ease-cinematic),
      translate var(--duration-spring) var(--ease-spring-critical);
  }
  &[data-starting-style] > * {
    opacity: 0;
    translate: 0 0.5rem;
  }
  &:not([data-ending-style]) {
    & > :nth-child(2) { transition-delay: var(--duration-stagger); }
    & > :nth-child(3) { transition-delay: calc(2 * var(--duration-stagger)); }
    & > :nth-child(4) { transition-delay: calc(3 * var(--duration-stagger)); }
    & > :nth-child(5) { transition-delay: calc(4 * var(--duration-stagger)); }
    & > :nth-child(6) { transition-delay: calc(5 * var(--duration-stagger)); }
    & > :nth-child(n + 7) { transition-delay: calc(6 * var(--duration-stagger)); }
  }
  @media (prefers-reduced-motion: reduce) {
    &[data-starting-style] > * {
      translate: none;
    }
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

/*
 * Sheets (Base UI Drawer): slide in from their side on the sheet spring and follow the finger while swiped; the
 * release takes the swipe velocity (--drawer-swipe-strength). Content arrives in parallax, the scrim dims and the
 * page behind recedes in proportion to how open the sheet is. Reduced motion: a short cross-fade.
 */
@utility sheet {
  transition: transform var(--duration-sheet) var(--ease-spring-critical), opacity var(--duration-fast) var(--ease-cinematic);
  &[data-swipe-direction="left"],
  &[data-swipe-direction="right"] {
    transform: translateX(var(--drawer-swipe-movement-x, 0px));
  }
  &[data-swipe-direction="up"],
  &[data-swipe-direction="down"] {
    transform: translateY(var(--drawer-swipe-movement-y, 0px));
  }
  &[data-swipe-direction="right"]:is([data-starting-style], [data-ending-style]) {
    transform: translateX(100%);
  }
  &[data-swipe-direction="left"]:is([data-starting-style], [data-ending-style]) {
    transform: translateX(-100%);
  }
  &[data-swipe-direction="down"]:is([data-starting-style], [data-ending-style]) {
    transform: translateY(100%);
  }
  &[data-swipe-direction="up"]:is([data-starting-style], [data-ending-style]) {
    transform: translateY(-100%);
  }
  &[data-ending-style] {
    transition-duration: calc(var(--drawer-swipe-strength, 1) * var(--duration-sheet) * 0.5);
    transition-timing-function: var(--ease-cinematic);
  }
  &[data-swiping] {
    transition-duration: 0ms;
  }
  @media (prefers-reduced-motion: reduce) {
    &:is([data-starting-style], [data-ending-style])[data-swipe-direction] {
      transform: none;
      opacity: 0;
    }
  }
}
@utility sheet-content {
  transition: translate var(--duration-sheet) var(--ease-spring-critical), opacity var(--duration-base) var(--ease-cinematic);
  [data-starting-style] & {
    opacity: 0;
  }
  [data-starting-style][data-swipe-direction="right"] & {
    translate: 2rem 0;
  }
  [data-starting-style][data-swipe-direction="left"] & {
    translate: -2rem 0;
  }
  [data-starting-style][data-swipe-direction="down"] & {
    translate: 0 2rem;
  }
  [data-starting-style][data-swipe-direction="up"] & {
    translate: 0 -2rem;
  }
  @media (prefers-reduced-motion: reduce) {
    translate: none !important;
  }
}
@utility sheet-backdrop {
  opacity: calc(1 - var(--drawer-swipe-progress, 0));
  transition: opacity var(--duration-sheet) var(--ease-cinematic);
  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
  }
  &[data-ending-style] {
    transition-duration: var(--duration-fast);
  }
  &[data-swiping] {
    transition-duration: 0ms;
  }
}
@utility sheet-indent {
  transform-origin: 50% 0;
  transition: scale var(--duration-sheet) var(--ease-spring-critical);
  &[data-active] {
    scale: calc(var(--recede-scale) + (1 - var(--recede-scale)) * var(--drawer-swipe-progress, 0));
  }
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
