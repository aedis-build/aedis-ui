"use client";

import * as React from "react";
import Link from "next/link";

import { CLI } from "@/components/site/install-command";
import { encodePreset, presetBlocks, presetChoices, presetLevels, presetTheme, type Block, type Preset } from "@/content/preset";
import { themeVariables } from "@/registry/aedis/lib/custom-theme";
import { ApprovalCard } from "@/registry/aedis/ui/approval-card";
import { Badge } from "@/registry/aedis/ui/badge";
import { BarChart } from "@/registry/aedis/ui/bar-chart";
import { Button } from "@/registry/aedis/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/registry/aedis/ui/card";
import { Checkbox } from "@/registry/aedis/ui/checkbox";
import { CodeBlock } from "@/registry/aedis/ui/code-block";
import { Label } from "@/registry/aedis/ui/label";
import { RadioGroup, RadioGroupItem } from "@/registry/aedis/ui/radio-group";
import { Sidebar } from "@/registry/aedis/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

type Key = "framework" | "theme" | "radius" | "motion";

function Segmented<K extends Key>({ name, label, value, onChange }: { name: K; label: string; value: Preset[K]; onChange: (v: Preset[K]) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-footnote font-medium">{label}</span>
      <Tabs value={value as string} onValueChange={(v) => onChange(v as Preset[K])}>
        <TabsList aria-label={label} className="h-auto flex-wrap justify-start">
          {Object.entries(presetChoices[name]).map(([k, text]) => <TabsTrigger key={k} value={k}>{text}</TabsTrigger>)}
        </TabsList>
      </Tabs>
    </div>
  );
}

/** Where each block shows up in the preview's navigation. */
const blockNav: Record<Block, { href: string; label: string; count?: number; countLabel?: string }> = {
  "agent-console": { href: "#agents", label: "Agents" },
  "approval-inbox": { href: "#approvals", label: "Approvals", count: 3, countLabel: "3 waiting" },
  "usage-limits": { href: "#usage", label: "Usage" },
  "secure-shell": { href: "#account", label: "Account" },
  charts: { href: "#reports", label: "Reports" },
  "mf-frame": { href: "#billing", label: "Billing (remote)" },
};

const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({ day, tokens: [59, 77, 68, 100, 90, 42, 31][i] * 1000 }));
const done = () => new Promise<null>((r) => setTimeout(() => r(null), 300));

/** The project builder: every choice maps to the preset the CLI applies, and the preview wears its theme. */
export function Create() {
  const [p, setP] = React.useState<Preset>({ framework: "n", theme: "d", radius: "m", motion: "s", level: "2", blocks: ["agent-console", "approval-inbox", "usage-limits"] });
  const set = <K extends keyof Preset>(k: K) => (v: Preset[K]) => setP((old) => ({ ...old, [k]: v }));
  const toggle = (b: Block, on: boolean) => setP((old) => ({ ...old, blocks: (Object.keys(presetBlocks) as Block[]).filter((x) => (x === b ? on : old.blocks.includes(x))) }));
  const id = encodePreset(p);
  const theme = presetTheme(p);
  const vars = theme ? themeVariables(theme, "light") : {};
  // Every choice shows in the preview, not only in the command: the navigation follows the blocks, the cards follow
  // what those blocks and the level install, and the top bar names the framework and the level.
  const nav = p.blocks.map((b) => blockNav[b]);
  const showUsage = p.blocks.includes("usage-limits") || p.blocks.includes("charts");
  const showApproval = p.blocks.includes("approval-inbox") || p.level === "3";

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <Card className="gap-5 p-5">
        <Segmented name="framework" label="Framework" value={p.framework} onChange={set("framework")} />
        <div className="space-y-1.5">
          <Segmented name="theme" label="Theme" value={p.theme} onChange={set("theme")} />
          <p className="text-caption text-muted-foreground">
            Custom: make one on <Link href="/themes" className="focus-ring rounded-xs text-link underline underline-offset-4">Themes</Link>, then <code className="font-mono">aedis theme import</code> after init.
          </p>
        </div>
        <Segmented name="radius" label="Radius" value={p.radius} onChange={set("radius")} />
        <Segmented name="motion" label="Motion" value={p.motion} onChange={set("motion")} />
        <div className="flex flex-col gap-2">
          <span id="create-level" className="text-footnote font-medium">Security level</span>
          <RadioGroup value={p.level} onValueChange={(v) => set("level")(v as Preset["level"])} aria-labelledby="create-level" className="flex flex-col gap-2">
            {(Object.keys(presetLevels) as Preset["level"][]).map((l) => (
              <label key={l} className="flex cursor-pointer items-start gap-2.5 rounded-md border border-hairline p-3 has-data-checked:border-primary has-data-checked:bg-accent-soft">
                <RadioGroupItem value={l} className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-callout font-semibold">{presetChoices.level[l]}</span>
                  <span className="text-caption text-muted-foreground">{presetLevels[l].adds}</span>
                  <span className="text-caption text-muted-foreground">Platform: {presetLevels[l].platform}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-footnote font-medium">Blocks</legend>
          {(Object.keys(presetBlocks) as Block[]).map((b) => (
            <div key={b} className="flex items-center gap-2.5">
              <Checkbox id={`create-${b}`} checked={p.blocks.includes(b)} onCheckedChange={(on) => toggle(b, on)} />
              <Label htmlFor={`create-${b}`}>{presetBlocks[b].label}</Label>
            </div>
          ))}
        </fieldset>
      </Card>

      <div className="min-w-0 space-y-4">
        <div className="overflow-hidden rounded-xl border border-hairline bg-background shadow-elevation-1" style={vars as React.CSSProperties}>
          {/* A preview of the app shell this preset starts from, in its theme: real components, sample data. */}
          <div inert data-slot="create-preview" className="grid grid-cols-1 bg-background text-foreground sm:grid-cols-[13rem_minmax(0,1fr)]">
            <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-2 text-caption text-muted-foreground sm:col-span-2">
              <span>{presetChoices.framework[p.framework]} app</span>
              <Badge variant="secondary">{presetChoices.level[p.level]}</Badge>
            </div>
            <Sidebar
              className="hidden border-r border-hairline sm:block"
              label="Preview navigation"
              header={<span className="px-2 font-semibold">My platform</span>}
              groups={[{ label: "Work", items: [{ href: "#home", label: "Home", active: true }, ...nav] }]}
              footer={p.level !== "1" ? <span className="px-2 text-caption text-muted-foreground">Signs out after 15 idle minutes</span> : undefined}
            />
            <div className="grid min-w-0 grid-cols-1 gap-4 p-5 xl:grid-cols-2">
              <h2 className="text-title-2 xl:col-span-2">Good morning</h2>
              {showUsage ? (
                <Card className="gap-3 p-4">
                  <CardHeader>
                    <CardTitle>Tokens this week</CardTitle>
                    <CardDescription>Every agent, all models</CardDescription>
                  </CardHeader>
                  <BarChart title="Tokens this week" data={week} index="day" series={[{ key: "tokens", label: "Tokens" }]} />
                  <Button size="sm" className="w-full">View usage</Button>
                </Card>
              ) : null}
              {showApproval ? (
                <ApprovalCard requester="Reports agent" requestedAt="2 min ago" content={"**Send the Q3 report outside the company**\n\nEmail `q3-report.pdf` to two recipients."} onApprove={done} onRequestChanges={done} />
              ) : null}
              {!showUsage && !showApproval ? (
                <Card className="gap-1 p-4 xl:col-span-2">
                  <CardTitle>Your pages go here</CardTitle>
                  <CardDescription>Pick blocks to start from, or build on the shell alone.</CardDescription>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
        <CodeBlock lang="bash" className="terminal" code={`npx ${CLI.replace(/@[\d.]+$/, "")} init --preset ${id}`} />
        <p className="text-caption text-muted-foreground">
          The preset names only these choices, with a checksum: the CLI rebuilds the theme through the theme validator, shows the choices and asks before writing anything. It never runs code from a preset.{" "}
          <Badge variant="outline">Next CLI release</Badge> <code className="font-mono">--preset</code> is not in {CLI} yet.
        </p>
      </div>
    </div>
  );
}
