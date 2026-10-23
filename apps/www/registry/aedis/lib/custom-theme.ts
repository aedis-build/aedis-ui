import { stripInvisible } from "@/lib/untrusted";

import { colorDistance, contrast, parseOklch } from "./contrast";
import { blurs, colors, contrastPairs, durations, fonts, radii, shadows, typeScale, type ColorName, type ShadowName } from "./tokens";

/**
 * A custom theme is typed data, never CSS. Every value is parsed and written back from numbers, so nothing a
 * theme says can close a rule, import a stylesheet or reach a url(). Themes change color, radius, blur, shadow
 * strength, font and type sizes: never display, visibility or opacity, so safety cues stay visible.
 */
export type CustomTheme = {
  version: 1;
  name: string;
  /** Overrides of the default colors; anything missing keeps the default. Hex or oklch() only. */
  colors: Record<ThemeMode, Partial<Record<ColorName, string>>>;
  /** Pixels, 0–32. */
  radius?: Partial<Record<RadiusName, number>>;
  /** Pixels, 0–40. */
  blur?: Partial<Record<BlurName, number>>;
  /** Multiplies the opacity of the default shadows, 0–2. */
  shadow?: number;
  /** Multiplies every motion duration, 0–1.5; 0 turns motion off. Reduced motion still wins. */
  motion?: number;
  font?: FontName;
  /** The type scale, within bounds that keep text readable (see `typeRanges`). */
  type?: Partial<Record<TypeKey, number>>;
};

/**
 * base: body size in px, every size follows it. scale: how far headings sit above body (1 is the default scale).
 * leading: body line height. Bounds keep body at 14 px or more and no text under 12 px.
 */
export const typeRanges = { base: [14, 18], scale: [0.8, 1.2], leading: [1.3, 1.7] } as const;
type TypeKey = keyof typeof typeRanges;
const MIN_TEXT_PX = 12;

export type ThemeMode = "light" | "dark";
type RadiusName = keyof typeof radii;
type BlurName = "thin" | "regular" | "thick";

/** System fonts only: nothing is downloaded, so a theme cannot use a font request as a tracking channel. */
export const themeFonts = {
  system: fonts.sans,
  rounded: `ui-rounded, "SF Pro Rounded", ${fonts.sans}`,
  serif: 'ui-serif, "New York", Georgia, "Times New Roman", serif',
};
export type FontName = keyof typeof themeFonts;

export type ThemeResult = { ok: true; theme: CustomTheme } | { ok: false; errors: string[] };

/** A stored or shared theme larger than this is refused before parsing. */
export const MAX_THEME_BYTES = 16_384;
export const MAX_THEME_NAME = 64;

const modes: ThemeMode[] = ["light", "dark"];
const blurNames: BlurName[] = ["thin", "regular", "thick"];
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const has = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const num = (n: number) => String(Number(n.toFixed(4)));

/** Hex or oklch() written back in canonical form; null for anything else. */
export function normalizeColor(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 64) return null;
  const v = value.trim();
  if (HEX.test(v)) {
    const h = v.slice(1).toLowerCase();
    return `#${h.length === 3 ? [...h].map((c) => c + c).join("") : h}`;
  }
  const o = parseOklch(v);
  if (!o) return null;
  return `oklch(${num(o.l)} ${num(o.c)} ${num(o.h)}${o.alpha === 1 ? "" : ` / ${num(o.alpha)}`})`;
}

function numberIn(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? Number(value.toFixed(2)) : null;
}

function unknownKeys(o: Record<string, unknown>, allowed: readonly string[], path: string) {
  return Object.keys(o).filter((k) => !allowed.includes(k)).map((k) => `${path}${k} is not part of the theme schema`);
}

/** Validates untrusted input (a parsed JSON value) and returns a normalized theme, or every reason it is refused. */
export function validateTheme(input: unknown): ThemeResult {
  if (!isRecord(input)) return { ok: false, errors: ["theme must be an object"] };
  const errors = unknownKeys(input, ["version", "name", "colors", "radius", "blur", "shadow", "motion", "font", "type"], "");
  if (input.version !== 1) errors.push("version must be 1");

  const name = typeof input.name === "string" ? stripInvisible(input.name).trim() : "";
  if (!name || name.length > MAX_THEME_NAME) errors.push(`name must be 1–${MAX_THEME_NAME} characters`);

  const theme: CustomTheme = { version: 1, name, colors: { light: {}, dark: {} } };
  if (!isRecord(input.colors)) errors.push("colors must be an object with light and dark");
  else {
    errors.push(...unknownKeys(input.colors, modes, "colors."));
    for (const mode of modes) {
      const given = input.colors[mode] ?? {};
      if (!isRecord(given)) {
        errors.push(`colors.${mode} must be an object`);
        continue;
      }
      for (const [token, value] of Object.entries(given)) {
        if (!has(colors, token)) errors.push(`colors.${mode}.${token} is not a theme color`);
        else {
          const color = normalizeColor(value);
          if (color) theme.colors[mode][token as ColorName] = color;
          else errors.push(`colors.${mode}.${token} must be a hex color or oklch()`);
        }
      }
    }
  }

  const ranged = <K extends string>(key: "radius" | "blur", names: readonly K[], max: number) => {
    const given = input[key];
    if (given === undefined) return undefined;
    if (!isRecord(given)) {
      errors.push(`${key} must be an object`);
      return undefined;
    }
    errors.push(...unknownKeys(given, names, `${key}.`));
    const out: Partial<Record<K, number>> = {};
    for (const n of names) {
      if (given[n] === undefined) continue;
      const v = numberIn(given[n], 0, max);
      if (v === null) errors.push(`${key}.${n} must be a number from 0 to ${max}`);
      else out[n] = v;
    }
    return out;
  };
  const radius = ranged("radius", Object.keys(radii) as RadiusName[], 32);
  if (radius) theme.radius = radius;
  const blur = ranged("blur", blurNames, 40);
  if (blur) theme.blur = blur;

  if (input.shadow !== undefined) {
    const v = numberIn(input.shadow, 0, 2);
    if (v === null) errors.push("shadow must be a number from 0 to 2");
    else theme.shadow = v;
  }
  if (input.motion !== undefined) {
    const v = numberIn(input.motion, 0, 1.5);
    if (v === null) errors.push("motion must be a number from 0 to 1.5");
    else theme.motion = v;
  }
  if (input.font !== undefined) {
    if (typeof input.font === "string" && has(themeFonts, input.font)) theme.font = input.font as FontName;
    else errors.push(`font must be one of ${Object.keys(themeFonts).join(", ")}`);
  }

  if (input.type !== undefined) {
    if (!isRecord(input.type)) errors.push("type must be an object");
    else {
      errors.push(...unknownKeys(input.type, Object.keys(typeRanges), "type."));
      const type: Partial<Record<TypeKey, number>> = {};
      for (const [k, [min, max]] of Object.entries(typeRanges) as [TypeKey, readonly [number, number]][]) {
        if (input.type[k] === undefined) continue;
        const v = numberIn(input.type[k], min, max);
        if (v === null) errors.push(`type.${k} must be a number from ${min} to ${max}`);
        else type[k] = v;
      }
      theme.type = type;
    }
  }

  if (errors.length === 0) errors.push(...readability(theme));
  return errors.length ? { ok: false, errors } : { ok: true, theme };
}

/** Contrast AA for every pair, and a destructive action that never looks like the primary one. */
function readability(theme: CustomTheme) {
  return modes.flatMap((mode) => {
    const c = resolvedColors(theme, mode);
    const problems = contrastPairs.flatMap(([fg, bg, min]) => {
      const ratio = contrast(c[fg], c[bg], c.background);
      return ratio < min ? [`${mode}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${min}:1`] : [];
    });
    if (colorDistance(c["destructive-solid"], c.primary) < 0.15) problems.push(`${mode}: destructive-solid is too close to primary`);
    return problems;
  });
}

/** Parses a stored or shared theme (localStorage, URL, file): size limit, JSON, then full validation. */
export function parseThemeJson(text: string): ThemeResult {
  if (new TextEncoder().encode(text).length > MAX_THEME_BYTES) return { ok: false, errors: [`theme is larger than ${MAX_THEME_BYTES} bytes`] };
  try {
    return validateTheme(JSON.parse(text));
  } catch {
    return { ok: false, errors: ["theme is not valid JSON"] };
  }
}

function resolvedColors(theme: CustomTheme, mode: ThemeMode) {
  return Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, theme.colors[mode][k as ColorName] ?? v[mode]])) as Record<ColorName, string>;
}

const scaleShadow = (value: string, factor: number) =>
  value.replace(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/g, (_m, r, g, b, a) => `rgba(${r},${g},${b},${num(Math.min(1, Number(a) * factor))})`);

/** Every CSS variable a theme sets in one mode, including the defaults it keeps. Only schema variables. */
export function themeVariables(theme: CustomTheme, mode: ThemeMode): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(resolvedColors(theme, mode))) vars[`--${k}`] = v;
  for (const [k, v] of Object.entries(shadows)) vars[`--${k}`] = scaleShadow(v[mode], theme.shadow ?? 1);
  for (const [k, v] of Object.entries(theme.radius ?? {})) vars[`--radius-${k}`] = `${v}px`;
  for (const [k, v] of Object.entries(theme.blur ?? {})) vars[`--blur-${k}`] = `${v}px`;
  if (theme.motion !== undefined) for (const [k, v] of Object.entries(durations)) vars[`--duration-${k}`] = `${num(parseFloat(v) * theme.motion)}ms`;
  if (theme.font) vars["--font-sans"] = themeFonts[theme.font];
  if (theme.type) Object.assign(vars, typeVariables(theme.type));
  return vars;
}

/** Sizes in rem from the type settings: every size follows base, headings move by scale, nothing under 12 px. */
export function typeVariables({ base = 16, scale = 1, leading }: Partial<Record<TypeKey, number>>): Record<string, string> {
  const px = (rem: string) => parseFloat(rem) * 16;
  const body = px(typeScale.body.size) * (base / 16);
  const vars: Record<string, string> = {};
  for (const [name, style] of Object.entries(typeScale)) {
    const size = px(style.size) * (base / 16);
    const out = size > body ? body + (size - body) * scale : size;
    vars[`--text-${name}`] = `${num(Math.max(MIN_TEXT_PX, out) / 16)}rem`;
  }
  if (leading !== undefined) vars["--text-body--line-height"] = num(leading);
  return vars;
}

/**
 * Applies a theme to `target` (the document root by default) one variable at a time through the CSSOM, never as
 * CSS text. The theme is validated again first. Returns a function that removes what it set.
 */
export function applyTheme(theme: unknown, { mode, target = document.documentElement }: { mode: ThemeMode; target?: HTMLElement }) {
  const result = validateTheme(theme);
  if (!result.ok) throw new Error(`Invalid theme: ${result.errors.join("; ")}`);
  const vars = themeVariables(result.theme, mode);
  for (const [k, v] of Object.entries(vars)) target.style.setProperty(k, v);
  target.style.setProperty("color-scheme", mode);
  return () => {
    for (const k of Object.keys(vars)) target.style.removeProperty(k);
    target.style.removeProperty("color-scheme");
  };
}

/**
 * The theme as a stylesheet for server rendering inside `<style nonce>`: light on :root, dark under the system
 * preference and `data-theme="dark"`. Built only from a validated theme's normalized values.
 */
export function themeToCss(theme: unknown) {
  const result = validateTheme(theme);
  if (!result.ok) throw new Error(`Invalid theme: ${result.errors.join("; ")}`);
  const body = (mode: ThemeMode) => Object.entries(themeVariables(result.theme, mode)).map(([k, v]) => `${k}: ${v};`).join(" ");
  return [
    `:root { ${body("light")} }`,
    `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { ${body("dark")} } }`,
    `:root[data-theme="dark"] { ${body("dark")} }`,
  ].join("\n");
}

/** Every variable a theme may set. */
export const themeVariableNames = new Set([
  ...Object.keys(colors).map((k) => `--${k}`),
  ...(Object.keys(shadows) as ShadowName[]).map((k) => `--${k}`),
  ...Object.keys(radii).map((k) => `--radius-${k}`),
  ...Object.keys(blurs).filter((k) => k !== "materialize").map((k) => `--blur-${k}`),
  ...Object.keys(durations).map((k) => `--duration-${k}`),
  "--font-sans",
  ...Object.keys(typeScale).map((k) => `--text-${k}`),
  "--text-body--line-height",
  "color-scheme",
]);
