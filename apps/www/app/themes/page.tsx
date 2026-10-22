import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { CLI } from "@/components/site/install-command";
import { ThemeEditor } from "@/components/site/theme-editor";
import { MAX_THEME_BYTES, MAX_THEME_NAME, themeFonts } from "@/registry/aedis/lib/custom-theme";
import { CodeBlock } from "@/registry/aedis/ui/code-block";

export const metadata: Metadata = { title: "Themes", description: "Create your own Aedis UI theme: edit it live, check contrast, export the JSON and import it with the CLI." };

const refused: [rule: string, why: string][] = [
  ["A text or control pair below contrast AA in light or dark: 4.5:1 for text, 3:1 for control outlines.", "A theme must never make a warning, a label or a field unreadable."],
  ["destructive-solid too close to primary.", "A destructive action must never look like the safe one."],
  ["A color that is not hex or oklch(): names, rgb(), var(), url(), anything with a ; or }.", "Values are parsed and written back as numbers, so a theme cannot close a rule, import a stylesheet or fetch a URL."],
  ["Radius outside 0–32 px, blur outside 0–40 px, shadow strength outside 0–2.", "Only numbers in a range; there is no unit or expression to inject."],
  [`A font outside ${Object.keys(themeFonts).join(", ")}.`, "System fonts only: nothing is downloaded, so a font cannot track who opened the page."],
  ["A key that is not in the schema, such as display, visibility or opacity.", "Themes change color and shape, never whether something is shown, so safety cues stay visible."],
  [`A file over ${MAX_THEME_BYTES / 1024} KB, invalid JSON, a version other than 1, or a name outside 1–${MAX_THEME_NAME} characters.`, "A shared theme is untrusted input. Hidden characters are also removed from the name."],
];

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="space-y-2">
      <h3 className="text-headline">{n}. {title}</h3>
      {children}
    </li>
  );
}

export default function Themes() {
  return (
    <article className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-title-1">Themes</h1>
        <p className="text-body text-muted-foreground">
          Make Aedis UI look like your product without editing a component. A theme is typed data, not CSS: it is validated in the editor, again
          by the CLI and again when it loads, and a theme that would hide or blur a safety cue is refused. The tokens it can change are listed in{" "}
          <Link href="/docs/theming" className="focus-ring rounded-xs underline underline-offset-4">Theming</Link>.
        </p>
      </header>

      <ThemeEditor />

      <section className="space-y-4">
        <h2 className="text-title-2">Create your own theme</h2>
        <ol className="space-y-6 text-callout">
          <Step n={1} title="Pick a starting point">
            <p>
              <strong>Light and dark</strong> starts from the default theme in both modes; <strong>Brand</strong> starts light mode from the Aedis brand
              palette (navy, gold, cream). Use the Light and Dark tabs to edit each mode: a theme always has both.
            </p>
          </Step>
          <Step n={2} title="Change the tokens">
            <p>Colors, the small and medium radius, shadow strength and font. The preview above is real components with your theme applied.</p>
          </Step>
          <Step n={3} title="Watch the contrast check">
            <p>
              Every change is validated as you make it. While a change fails, the editor says why and keeps previewing and saving the last valid
              theme, so you can never export one that the CLI would refuse.
            </p>
          </Step>
          <Step n={4} title="Export the JSON">
            <p>Download JSON saves <code className="font-mono">aedis-theme.json</code>. Put it inside your app; the CLI only reads files in the project.</p>
          </Step>
          <Step n={5} title="Import it with the CLI">
            <CodeBlock lang="bash" code={`npx ${CLI} theme import aedis-theme.json`} />
            <p>
              The CLI runs the same validation and writes <code className="font-mono">aedis-custom-theme.css</code> to the styles folder in{" "}
              <code className="font-mono">aedis.json</code> (<code className="font-mono">src/styles</code> or <code className="font-mono">styles</code> by default). If the
              theme is refused, it lists every reason and writes nothing. Run it from the project root, or pass <code className="font-mono">--cwd &lt;dir&gt;</code>.
            </p>
          </Step>
          <Step n={6} title="Import the CSS after the Aedis theme">
            <CodeBlock lang="css" title="app/globals.css" code={'@import "tailwindcss";\n@import "./styles/aedis-theme.css";\n@import "./styles/aedis-custom-theme.css";'} />
            <p>Order matters: the custom theme overrides the default variables only because it comes later.</p>
          </Step>
          <Step n={7} title="Set data-theme">
            <CodeBlock lang="html" code={'<html data-theme="dark">   <!-- "light" or "dark"; leave it out to follow the system -->'} />
            <p>
              Do not combine a custom theme with <code className="font-mono">data-theme=&quot;brand&quot;</code>: the built-in brand rule is more specific and wins.
              To start from the brand look, pick Brand in step 1 instead.
            </p>
          </Step>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-title-2">What validation refuses</h2>
        <p className="text-callout text-muted-foreground">The editor, the CLI and the runtime share one validator, so they always agree.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-callout">
            <thead>
              <tr>
                <th className="py-2 pr-4 text-footnote font-medium text-muted-foreground">Refused</th>
                <th className="py-2 pr-4 text-footnote font-medium text-muted-foreground">Why</th>
              </tr>
            </thead>
            <tbody>
              {refused.map(([rule, why]) => (
                <tr key={rule} className="border-t border-border">
                  <td className="py-2 pr-4 align-top">{rule}</td>
                  <td className="py-2 pr-4 align-top text-muted-foreground">{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-title-2">At runtime</h2>
        <p className="text-callout text-muted-foreground">
          For themes chosen by users, apply them without a build step. <code className="font-mono">applyTheme</code> sets each variable through the CSSOM, never as CSS text.
        </p>
        <CodeBlock lang="bash" code={`npx ${CLI} add custom-theme`} />
        <CodeBlock
          lang="tsx"
          code={`import { applyTheme, parseThemeJson, themeToCss } from "@/lib/custom-theme";

const result = parseThemeJson(saved);          // untrusted: validated again
if (result.ok) applyTheme(result.theme, { mode: "dark" });

// Server rendering: only validated values reach the page.
<style nonce={nonce}>{themeToCss(theme)}</style>`}
        />
      </section>
    </article>
  );
}
