import { validateTheme, type CustomTheme } from "@/registry/aedis/lib/custom-theme";
import { colors, radii } from "@/registry/aedis/lib/tokens";

/**
 * A Create preset: the choices of /create, as the id `aedis init --preset <id>` takes. The id names choices from fixed
 * lists and nothing else, so a preset is data the CLI already knows how to apply: it can never carry code, a URL or a
 * file path. The CLI decodes it, rebuilds the theme through validateTheme, prints it and asks before applying it.
 *
 * Format: <framework><theme><radius><motion><level>-<blocks, 2 hex>-<checksum, 8 hex>, e.g. nbms3-07-1f0c2a9e. The
 * checksum (FNV-1a) catches an edited or mistyped id; it is not a signature, which a static page could not make.
 */
export const presetChoices = {
  framework: { n: "Next.js", v: "Vite" },
  theme: { d: "Light and dark", b: "Brand" },
  radius: { s: "Small", m: "Medium", l: "Large" },
  motion: { c: "Cinematic", s: "Subtle", o: "Off" },
  level: { "1": "L1 Baseline", "2": "L2 Hardened", "3": "L3 Regulated" },
} as const;

type Choice<K extends keyof typeof presetChoices> = keyof (typeof presetChoices)[K];
export type Preset = { framework: Choice<"framework">; theme: Choice<"theme">; radius: Choice<"radius">; motion: Choice<"motion">; level: Choice<"level">; blocks: Block[] };

/** Blocks a preset can add; each installs these registry items. */
export const presetBlocks = {
  "agent-console": { label: "Agent console", items: ["agent-console"] },
  "approval-inbox": { label: "Approvals inbox", items: ["approval-inbox"] },
  "usage-limits": { label: "Usage and ceilings", items: ["usage-limits"] },
  "secure-shell": { label: "Secure shell", items: ["secure-shell"] },
  charts: { label: "Charts", items: ["area-chart", "bar-chart", "line-chart", "pie-chart", "radial-chart"] },
  "mf-frame": { label: "Micro-frontend frame", items: ["mf-frame"] },
} as const;
export type Block = keyof typeof presetBlocks;
const blockOrder = Object.keys(presetBlocks) as Block[];

/**
 * The levels, named as the Aedis Platform conformance levels: what the UI installs for each, and what the platform's
 * own checks add (aedis-platform docs/conformance.md).
 */
export const presetLevels = {
  "1": { items: [] as string[], adds: "Security headers, bounded inputs and api() for every call (what init installs).", platform: "Scorecard published, coverage ≥ 60 % lines." },
  "2": { items: ["use-idle-timeout"], adds: "Plus an idle timeout that signs out and revokes the session.", platform: "SAST gate, Scorecard ≥ 7, coverage ≥ 75/60 % with no regression." },
  "3": { items: ["use-idle-timeout", "approval-card"], adds: "Plus approvals before any outbound action.", platform: "DAST gate, evidence retained, coverage ≥ 85/70 %, production only by reviewed PR." },
} as const;

const ID = /^([nv])([db])([sml])([cso])([123])-([0-9a-f]{2})-([0-9a-f]{8})$/;

/** FNV-1a, 32 bit, as 8 hex digits. */
export function checksum(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0");
}

export function encodePreset(p: Preset) {
  const mask = p.blocks.reduce((m, b) => m | (1 << blockOrder.indexOf(b)), 0);
  const code = `${p.framework}${p.theme}${p.radius}${p.motion}${p.level}-${mask.toString(16).padStart(2, "0")}`;
  return `${code}-${checksum(code)}`;
}

/** The preset an id names, or why it is refused. Only ids made of known choices with a matching checksum pass. */
export function decodePreset(id: string): { ok: true; preset: Preset } | { ok: false; error: string } {
  const m = ID.exec(id.trim());
  if (!m) return { ok: false, error: "not a preset id (expected e.g. nbms3-07-1f0c2a9e)" };
  if (checksum(id.trim().slice(0, -9)) !== m[7]) return { ok: false, error: "the checksum does not match: the id was edited or mistyped" };
  const mask = parseInt(m[6], 16);
  if (mask >= 1 << blockOrder.length) return { ok: false, error: "unknown block" };
  return {
    ok: true,
    preset: { framework: m[1] as Preset["framework"], theme: m[2] as Preset["theme"], radius: m[3] as Preset["radius"], motion: m[4] as Preset["motion"], level: m[5] as Preset["level"], blocks: blockOrder.filter((_, i) => mask & (1 << i)) },
  };
}

const radiusScale = { s: 0.5, m: 1, l: 1.5 };
const motionScale = { c: 1.25, s: 1, o: 0 };

/** The preset's theme, built from the choices and validated like any custom theme; null when it keeps every default. */
export function presetTheme(p: Preset): CustomTheme | null {
  if (p.theme === "d" && p.radius === "m" && p.motion === "s") return null;
  const brand = Object.fromEntries(Object.entries(colors).filter(([, v]) => /^#/.test(v.brand)).map(([k, v]) => [k, v.brand]));
  const theme = {
    version: 1,
    name: `Create preset ${encodePreset(p)}`,
    colors: { light: p.theme === "b" ? brand : {}, dark: {} },
    radius: Object.fromEntries(Object.entries(radii).map(([k, v]) => [k, Math.min(32, Math.round(parseFloat(v) * radiusScale[p.radius]))])),
    motion: motionScale[p.motion],
  };
  const result = validateTheme(theme);
  if (!result.ok) throw new Error(`preset theme: ${result.errors.join("; ")}`);
  return result.theme;
}

/** Every registry item the preset installs on top of init's, each once. */
export const presetItems = (p: Preset) => [...new Set([...presetLevels[p.level].items, ...p.blocks.flatMap((b) => presetBlocks[b].items)])];
