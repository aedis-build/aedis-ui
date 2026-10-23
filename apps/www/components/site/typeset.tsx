"use client";

import * as React from "react";

import { CLI } from "@/components/site/install-command";
import { themeFonts, typeVariables, validateTheme, type FontName } from "@/registry/aedis/lib/custom-theme";
import { typeScale } from "@/registry/aedis/lib/tokens";
import { Badge } from "@/registry/aedis/ui/badge";
import { Card } from "@/registry/aedis/ui/card";
import { CodeBlock } from "@/registry/aedis/ui/code-block";
import { Markdown } from "@/registry/aedis/ui/markdown";
import { Tabs, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

// Agent-written prose, with raw HTML in it on purpose: Markdown never renders it.
const sample = `## Why the agent asked before sending

Any action that leaves the company goes through an approval. The agent drafts it, a person decides, and the decision is logged with who, when and why.

### What the approver sees

- The action, in plain words
- Every recipient, one per line
- The agent's reasoning, rendered as text

> "Approve" never has focus first. Declining is always one key away.

<b onclick="alert(1)">This tag is not rendered.</b>`;

const shown = ["display", "title-1", "title-2", "title-3", "headline", "body", "callout", "footnote", "caption"] as const;

function Choice<T extends string | number>({ label, value, options, onChange, format = String }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void; format?: (v: T) => string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-footnote font-medium">{label}</span>
      <Tabs value={String(value)} onValueChange={(v) => onChange(options.find((o) => String(o) === v)!)}>
        <TabsList aria-label={label} className="h-auto flex-wrap justify-start">
          {options.map((o) => <TabsTrigger key={String(o)} value={String(o)}>{format(o)}</TabsTrigger>)}
        </TabsList>
      </Tabs>
    </div>
  );
}

/**
 * Type settings on real content. Every choice maps to the theme's type tokens through the custom-theme validator, so
 * what you copy is a theme `aedis theme import` accepts; the bounds (14–18 px body, nothing under 12 px) are its own.
 */
export function Typeset() {
  const [font, setFont] = React.useState<FontName>("system");
  const [base, setBase] = React.useState(16);
  const [scale, setScale] = React.useState(1);
  const [leading, setLeading] = React.useState(1.5);
  const [measure, setMeasure] = React.useState(68);

  const theme = { version: 1, name: "Typeset", colors: { light: {}, dark: {} }, font, type: { base, scale, leading } };
  const result = validateTheme(theme);
  const vars: Record<string, string> = { "--font-sans": themeFonts[font], ...typeVariables({ base, scale, leading }) };
  const css = `:root {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}`;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <Card className="gap-4 p-5 lg:sticky lg:top-20">
        <Choice label="Font" value={font} options={["system", "rounded", "serif"] as FontName[]} onChange={setFont} format={(f) => f[0].toUpperCase() + f.slice(1)} />
        <Choice label="Base size" value={base} options={[14, 15, 16, 17, 18]} onChange={setBase} format={(n) => `${n}`} />
        <Choice label="Scale" value={scale} options={[0.85, 1, 1.15]} onChange={setScale} format={(n) => (n < 1 ? "Compact" : n > 1 ? "Expressive" : "Default")} />
        <Choice label="Line height of body" value={leading} options={[1.3, 1.4, 1.5, 1.6, 1.7]} onChange={setLeading} />
        <Choice label="Prose width (preview)" value={measure} options={[60, 68, 76]} onChange={setMeasure} format={(n) => `${n} ch`} />
        <p className="text-caption text-muted-foreground" role="status">
          {result.ok ? "Valid theme: aedis theme import accepts it." : result.errors.join("; ")}
        </p>
        <CodeBlock lang="css" title="CSS variables" code={css} />
        <CodeBlock lang="json" title="typeset.json" code={JSON.stringify(theme, null, 2)} />
        <CodeBlock lang="bash" code={`npx ${CLI} theme import typeset.json`} />
      </Card>

      <div className="min-w-0 space-y-6" style={vars as React.CSSProperties}>
        <Card className="gap-0 px-6 py-2 font-sans">
          {shown.map((name) => (
            <div key={name} className="flex flex-col gap-1 border-b border-hairline py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-5">
              <span className="w-44 shrink-0 text-caption text-muted-foreground">
                {name}
                <br />
                <span className="font-mono">{vars[`--text-${name}`]} / {name === "body" ? leading : typeScale[name].lineHeight} / {typeScale[name].weight}</span>
              </span>
              <span className={`text-${name} min-w-0`}>Secure foundations, fluid interface</span>
            </div>
          ))}
        </Card>
        <Card className="gap-3 p-8 font-sans" style={{ maxWidth: `calc(${measure}ch + 4rem)` }}>
          <Badge variant="accent" className="self-start">Rendered by Markdown</Badge>
          <Markdown className="space-y-3 text-body [&_blockquote]:rounded-r-md [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:bg-background [&_blockquote]:px-4 [&_blockquote]:py-2 [&_h2]:text-title-2 [&_h3]:pt-1 [&_h3]:text-title-3">{sample}</Markdown>
          <p className="text-caption text-muted-foreground">
            The last line of the source is a <code className="font-mono">&lt;b onclick&gt;</code> tag. Markdown drops raw HTML tags and keeps only their text, so it never becomes markup.
          </p>
        </Card>
      </div>
    </div>
  );
}
