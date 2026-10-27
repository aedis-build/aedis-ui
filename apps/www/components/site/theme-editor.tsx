"use client";

import * as React from "react";

import { applyTheme, normalizeColor, parseThemeJson, themeFonts, validateTheme, type CustomTheme, type FontName, type ThemeMode } from "@/registry/aedis/lib/custom-theme";
import { colors, type ColorName } from "@/registry/aedis/lib/tokens";
import { Badge } from "@/registry/aedis/ui/badge";
import { Button } from "@/registry/aedis/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/aedis/ui/card";
import { Checkbox } from "@/registry/aedis/ui/checkbox";
import { Input } from "@/registry/aedis/ui/input";
import { Label } from "@/registry/aedis/ui/label";
import { Progress } from "@/registry/aedis/ui/progress";
import { Switch } from "@/registry/aedis/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";
import { Textarea } from "@/registry/aedis/ui/textarea";

export const STORAGE_KEY = "aedis-ui-theme";

const editable: ColorName[] = ["background", "surface", "foreground", "muted-foreground", "primary", "primary-foreground", "accent", "accent-foreground", "destructive-solid", "border-control"];

const initial: CustomTheme = { version: 1, name: "My theme", colors: { light: {}, dark: {} }, radius: { sm: 8, md: 12 }, shadow: 1, font: "system" };

// The brand palette as light colors; its translucent tokens (rgba) are not theme values, so they keep the default.
const brand = Object.fromEntries(Object.entries(colors).filter(([, v]) => normalizeColor(v.brand)).map(([k, v]) => [k, v.brand]));
const starts = { default: { light: {}, dark: {} }, brand: { light: brand, dark: {} } } satisfies Record<string, CustomTheme["colors"]>;

/** Live, validated theme editing over real components. Only a theme that passes validation is ever applied or saved. */
export function ThemeEditor() {
  const [draft, setDraft] = React.useState<CustomTheme>(initial);
  const [mode, setMode] = React.useState<ThemeMode>("light");
  const [imported, setImported] = React.useState("");
  const [importErrors, setImportErrors] = React.useState<string[]>([]);
  const [importedName, setImportedName] = React.useState<string | null>(null);
  const preview = React.useRef<HTMLDivElement>(null);
  const lastValid = React.useRef<CustomTheme>(initial);
  const result = React.useMemo(() => validateTheme(draft), [draft]);
  if (result.ok) lastValid.current = result.theme;
  const applied = lastValid.current;

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // Stored themes are untrusted: validated again on load, ignored when refused.
      const parsed = stored ? parseThemeJson(stored) : null;
      if (parsed?.ok) setDraft(parsed.theme);
    } catch {
      // Storage can be unavailable (private mode, blocked site data); the editor still works.
    }
  }, []);

  React.useEffect(() => {
    if (!preview.current) return;
    return applyTheme(applied, { mode, target: preview.current });
  }, [applied, mode]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(applied));
    } catch {
      // See above.
    }
  }, [applied]);

  const color = (token: ColorName) => draft.colors[mode][token] ?? colors[token][mode];
  const setColor = (token: ColorName, value: string) => setDraft((d) => ({ ...d, colors: { ...d.colors, [mode]: { ...d.colors[mode], [token]: value } } }));
  const json = JSON.stringify(applied, null, 2);

  function download() {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "aedis-theme.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importTheme() {
    const parsed = parseThemeJson(imported);
    setImportErrors(parsed.ok ? [] : parsed.errors);
    setImportedName(parsed.ok ? parsed.theme.name : null);
    if (parsed.ok) setDraft(parsed.theme);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()} aria-label="Theme editor">
        <fieldset className="space-y-1.5">
          <legend className="text-callout font-medium">Start from</legend>
          <div className="flex gap-2">
            {(Object.keys(starts) as (keyof typeof starts)[]).map((s) => (
              <Button key={s} type="button" variant="secondary" size="sm" onClick={() => setDraft((d) => ({ ...d, colors: starts[s] }))}>
                {s === "default" ? "Light and dark" : "Brand"}
              </Button>
            ))}
          </div>
        </fieldset>
        <div className="space-y-1.5">
          <Label htmlFor="theme-name">Name</Label>
          <Input id="theme-name" maxLength={64} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as ThemeMode)}>
          <TabsList aria-label="Mode">
            <TabsTrigger value="light">Light</TabsTrigger>
            <TabsTrigger value="dark">Dark</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid grid-cols-2 gap-3">
          {editable.map((token) => (
            <div key={token} className="flex items-center gap-2">
              <Input id={`color-${token}`} type="color" className="h-8 w-10 shrink-0 cursor-pointer p-0.5" value={color(token)} onChange={(e) => setColor(token, e.target.value)} />
              <Label htmlFor={`color-${token}`} className="font-mono text-footnote font-normal">{token}</Label>
            </div>
          ))}
        </div>
        {(["sm", "md"] as const).map((r) => (
          <div key={r} className="space-y-1.5">
            <Label htmlFor={`radius-${r}`}>Radius {r}: {draft.radius?.[r] ?? 0}px</Label>
            <Input id={`radius-${r}`} type="range" min={0} max={32} value={draft.radius?.[r] ?? 0} onChange={(e) => setDraft({ ...draft, radius: { ...draft.radius, [r]: Number(e.target.value) } })} />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label htmlFor="shadow">Shadow strength: {draft.shadow ?? 1}</Label>
          <Input id="shadow" type="range" min={0} max={2} step={0.1} value={draft.shadow ?? 1} onChange={(e) => setDraft({ ...draft, shadow: Number(e.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="font">Font</Label>
          <select
            id="font"
            value={draft.font ?? "system"}
            onChange={(e) => setDraft({ ...draft, font: e.target.value as FontName })}
            className="focus-ring h-9 w-full rounded-sm border border-border-control bg-surface px-2 text-callout"
          >
            {Object.keys(themeFonts).map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </form>

      <div className="space-y-4">
        <div role="status" aria-live="polite" className="text-callout">
          {result.ok ? (
            <p className="text-success">Passes contrast AA in light and dark. This is the theme being previewed and saved.</p>
          ) : (
            <div className="space-y-1">
              <p className="text-destructive">Not applied: the preview keeps the last valid theme.</p>
              <ul className="list-disc pl-5 text-footnote text-muted-foreground">
                {result.errors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div ref={preview} data-testid="theme-preview" className="space-y-4 rounded-lg bg-background p-6 text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          <Card>
            <CardHeader>
              <CardTitle>Approval pending</CardTitle>
              <CardDescription>The agent wants to send the report outside the company.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button>Approve</Button>
                <Button variant="secondary">Request changes</Button>
                <Button variant="destructive">Revoke</Button>
                <Button variant="link">Details</Button>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Badge variant="accent">3 waiting</Badge>
                <Badge variant="outline">Draft</Badge>
                <span className="flex items-center gap-2 text-callout"><Switch aria-label="Autopilot" defaultChecked /> Autopilot</span>
                <span className="flex items-center gap-2 text-callout"><Checkbox aria-label="Notify" defaultChecked /> Notify</span>
              </div>
              <Input aria-label="Preview field" placeholder="name@company.com" />
              <Progress value={62} aria-label="Ceiling used" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="theme-export">Export</Label>
            <Textarea id="theme-export" readOnly rows={8} className="font-mono text-footnote" maxLength={16384} value={json} />
            <Button variant="secondary" onClick={download}>Download JSON</Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme-import">Import</Label>
            <Textarea id="theme-import" rows={8} className="font-mono text-footnote" maxLength={16384} value={imported} onChange={(e) => setImported(e.target.value)} placeholder='{ "version": 1, ... }' />
            <Button variant="secondary" onClick={importTheme}>Import theme</Button>
            <p role="status" className="text-footnote text-success">{importedName === null ? "" : `Imported “${importedName}”: the editor and the preview now use it.`}</p>
            {importErrors.length ? (
              <ul role="alert" className="list-disc pl-5 text-footnote text-destructive">
                {importErrors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
