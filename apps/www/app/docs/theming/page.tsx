import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { pageMetadata } from "@/content/share";
import { contrast } from "@/registry/aedis/lib/contrast";
import { blurs, colors, colorUsage, contrastPairs, durations, easings, radii, scales, shadows, themeNames, typeScale } from "@/registry/aedis/lib/tokens";

export const metadata: Metadata = pageMetadata("/docs/theming");

const code = "rounded-md border border-hairline bg-muted px-4 py-3 font-mono text-code overflow-x-auto";
const th = "py-2 pr-4 text-footnote font-medium text-muted-foreground";
const td = "py-2 pr-4 align-middle";

// Written out so Tailwind sees every class.
const typeClass: Record<keyof typeof typeScale, string> = {
  display: "text-display",
  "title-1": "text-title-1",
  "title-2": "text-title-2",
  "title-3": "text-title-3",
  headline: "text-headline",
  body: "text-body",
  callout: "text-callout",
  footnote: "text-footnote",
  caption: "text-caption",
  code: "text-code font-mono",
};
const shadowClass: Record<keyof typeof shadows, string> = {
  "elevation-1": "shadow-elevation-1",
  "elevation-2": "shadow-elevation-2",
  "elevation-3": "shadow-elevation-3",
  "elevation-4": "shadow-elevation-4",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-title-2">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap font-mono text-footnote">
      <span aria-hidden="true" className="size-5 rounded-xs border border-hairline" style={{ background: value }} />
      {value}
    </span>
  );
}

export default function Theming() {
  return (
    <article className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-title-1">Theming</h1>
        <p className="text-body text-muted-foreground">
          Components use semantic Tailwind tokens backed by CSS variables, generated from typed data in{" "}
          <code className="font-mono text-code">registry/aedis/lib/tokens.ts</code>. Light and dark are the default; the Aedis brand
          (navy, gold, cream) is an extra theme. Never edit a component to change how it looks.
        </p>
      </header>

      <Section title="Choosing a theme">
        <p className="text-callout text-muted-foreground">
          Without <code className="font-mono">data-theme</code>, the theme follows the system. Set it on <code className="font-mono">&lt;html&gt;</code> to choose one.
        </p>
        <pre className={code}>
          <code>{`<html data-theme="dark">   <!-- "light", "dark" or "brand" -->`}</code>
        </pre>
      </Section>

      <Section title="Color">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-callout">
            <thead>
              <tr>
                <th className={th}>Token</th>
                {themeNames.map((t) => <th key={t} className={th}>{t}</th>)}
                <th className={`${th} min-w-56`}>Used for</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(colors).map(([name, value]) => (
                <tr key={name} className="border-t border-border">
                  <td className={`${td} whitespace-nowrap font-mono text-footnote`}>--{name}</td>
                  {themeNames.map((t) => <td key={t} className={td}><Swatch value={value[t]} /></td>)}
                  <td className={`${td} min-w-56`}>{colorUsage[name as keyof typeof colors]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Contrast">
        <p className="text-callout text-muted-foreground">
          Every pair is checked by the test suite in every theme: 4.5:1 for text, 3:1 for control outlines. Translucent colors are measured over the page background.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-callout">
            <thead>
              <tr>
                <th className={th}>Foreground on background</th>
                <th className={th}>Minimum</th>
                {themeNames.map((t) => <th key={t} className={th}>{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {contrastPairs.map(([fg, bg, min]) => (
                <tr key={`${fg}-${bg}`} className="border-t border-border">
                  <td className={`${td} font-mono text-footnote`}>{fg} on {bg}</td>
                  <td className={td}>{min}:1</td>
                  {themeNames.map((t) => (
                    <td key={t} className={`${td} tabular-nums`}>{contrast(colors[fg][t], colors[bg][t], colors.background[t]).toFixed(1)}:1</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Typography">
        <p className="text-callout text-muted-foreground">
          The system font (San Francisco on Apple, Segoe UI Variable on Windows), in rem so it follows the reader's text size. Tracking tightens and leading drops as the size grows.
        </p>
        <div className="space-y-3">
          {Object.entries(typeScale).map(([name, s]) => (
            <div key={name} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-border pt-3">
              <span className="w-24 font-mono text-footnote text-muted-foreground">text-{name}</span>
              <span className={typeClass[name as keyof typeof typeScale]}>Secure foundations, fluid interface</span>
              <span className="font-mono text-footnote text-muted-foreground">{s.size} / {s.lineHeight} / {s.tracking} / {s.weight}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Shape">
        <p className="text-callout text-muted-foreground">
          Concentric radii: inside a rounded surface, the inner radius is the outer one minus the padding. A <code className="font-mono">rounded-lg</code> (16px) card with 8px of padding holds a <code className="font-mono">rounded-sm</code> (8px) button.
        </p>
        <div className="flex flex-wrap gap-4">
          {Object.entries(radii).map(([name, value]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <span aria-hidden="true" className="size-16 border border-border-control bg-surface" style={{ borderRadius: value }} />
              <span className="font-mono text-footnote">rounded-{name} · {value}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Depth and material">
        <div className="grid gap-4 sm:grid-cols-4">
          {Object.keys(shadows).map((name) => (
            <div key={name} className={`flex h-20 items-center justify-center rounded-md bg-surface font-mono text-footnote ${shadowClass[name as keyof typeof shadows]}`}>shadow-{name}</div>
          ))}
        </div>
        <p className="text-callout text-muted-foreground">
          <code className="font-mono">material-thin</code>, <code className="font-mono">material-regular</code> and <code className="font-mono">material-thick</code> are translucent with a backdrop blur ({Object.entries(blurs).filter(([n]) => n !== "materialize").map(([n, v]) => `${n} ${v}`).join(", ")}) and a light top edge.
          They turn solid under <code className="font-mono">prefers-reduced-transparency</code>; borders become control outlines under <code className="font-mono">prefers-contrast: more</code>.
          Where content scrolls under floating chrome, <code className="font-mono">scroll-edge</code> and <code className="font-mono">scroll-fade-y</code> fade it instead of drawing a line.
        </p>
      </Section>

      <Section title="Motion">
        <p className="text-callout text-muted-foreground">
          Cinematic, never stiff: long soft entrances, short exits, every transition interruptible. Springs are sampled with <code className="font-mono">linear()</code>, so there is no dependency.
          <code className="font-mono"> press</code> sinks to {scales.press} on pointer-down; <code className="font-mono">materialize</code> grows popovers and dialogs out of their trigger from {scales.materialize} with a {blurs.materialize} blur clearing.
          On a page, <code className="font-mono">enter</code> brings its children in one after another ({durations["enter-stagger"]} apart) as the page loads, and
          <code className="font-mono"> lift</code> raises an interactive card 4 px on the spring with a deeper shadow.
          Under <code className="font-mono">prefers-reduced-motion</code> scale, blur and bounce turn into a short cross-fade.
          For code on a dark surface in any theme, such as a terminal on a light page, put <code className="font-mono">terminal</code> on the CodeBlock: it uses the dark theme&apos;s own colors.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <table className="w-full text-left text-callout">
            <thead><tr><th className={th}>Duration</th><th className={th}>Value</th></tr></thead>
            <tbody>
              {Object.entries(durations).map(([n, v]) => (
                <tr key={n} className="border-t border-border"><td className={`${td} font-mono text-footnote`}>--duration-{n}</td><td className={td}>{v}</td></tr>
              ))}
            </tbody>
          </table>
          <table className="w-full text-left text-callout">
            <thead><tr><th className={th}>Easing</th><th className={th}>Value</th></tr></thead>
            <tbody>
              {Object.entries(easings).map(([n, v]) => (
                <tr key={n} className="border-t border-border"><td className={`${td} font-mono text-footnote`}>ease-{n}</td><td className={`${td} break-all font-mono text-footnote`}>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Custom themes">
        <p className="text-callout text-muted-foreground">
          To make your own theme, edit it live, export it and import it with the CLI, see{" "}
          <Link href="/themes" className="focus-ring rounded-xs underline underline-offset-4">Themes</Link>.
        </p>
      </Section>
    </article>
  );
}
