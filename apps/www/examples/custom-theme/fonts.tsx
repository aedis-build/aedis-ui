"use client";

import * as React from "react";

import { themeVariables, validateTheme } from "@/registry/aedis/lib/custom-theme";
import { Field, FieldControl, FieldDescription, FieldLabel } from "@/registry/aedis/ui/field";
import { Select } from "@/registry/aedis/ui/select";

const presets = ["system", "rounded", "serif", "mono"].map((p) => ({ value: p, label: p }));

/** A theme's fonts through the same validator as `aedis theme import`: what it accepts, and the variables it writes. */
export default function CustomThemeFonts() {
  const [display, setDisplay] = React.useState<string | null>("serif");
  const [family, setFamily] = React.useState("");
  const fonts = { sans: "system", display: family.trim() || display || "system", mono: "mono" };
  const result = validateTheme({ version: 1, name: "Studio", colors: { light: {}, dark: {} }, fonts });
  const vars = result.ok ? themeVariables(result.theme, "light") : {};
  const fontVars = Object.fromEntries(Object.entries(vars).filter(([k]) => k.startsWith("--font-")));
  return (
    <div className="grid w-full max-w-xl gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="display">
          <FieldLabel>Display preset</FieldLabel>
          <Select options={presets} value={display} onValueChange={setDisplay} />
        </Field>
        <Field name="family">
          <FieldLabel>Self-hosted display family</FieldLabel>
          <FieldControl maxLength={60} placeholder="Fraunces" value={family} onChange={(e) => setFamily(e.currentTarget.value)} />
          <FieldDescription>Wins over the preset.</FieldDescription>
        </Field>
      </div>
      <div style={fontVars as React.CSSProperties} className="grid gap-2 rounded-md border border-hairline bg-surface p-4 font-sans">
        <h3 className="text-title-2">Selected work</h3>
        <p className="text-body">Identity, signage and a website for a ceramics studio.</p>
        <code className="font-mono text-code">--font-display</code>
      </div>
      <pre role="status" aria-label="Theme fonts" className="overflow-x-auto rounded-sm border border-hairline bg-surface p-3 font-mono text-footnote whitespace-pre-wrap">
        {result.ok ? Object.entries(fontVars).map(([k, v]) => `${k}: ${v};`).join("\n") : result.errors.join("\n")}
      </pre>
    </div>
  );
}
