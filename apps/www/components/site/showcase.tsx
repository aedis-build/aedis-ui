"use client";

import * as React from "react";
import Link from "next/link";

import { AgentConsole, type ConsoleTurn } from "@/registry/aedis/blocks/agent-console";
import { ApprovalCard } from "@/registry/aedis/ui/approval-card";
import { Badge } from "@/registry/aedis/ui/badge";
import { BarChart } from "@/registry/aedis/ui/bar-chart";
import { Button } from "@/registry/aedis/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/aedis/ui/card";
import { Checkbox } from "@/registry/aedis/ui/checkbox";
import { Input } from "@/registry/aedis/ui/input";
import { Label } from "@/registry/aedis/ui/label";
import { Progress } from "@/registry/aedis/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/registry/aedis/ui/radio-group";
import { Sidebar } from "@/registry/aedis/ui/sidebar";
import { Switch } from "@/registry/aedis/ui/switch";
import { Textarea } from "@/registry/aedis/ui/textarea";

// Sample data for the showcase: every card below is the registry component itself, wired to nothing.
const tokens = [
  { day: "Mon", tokens: 59_000 },
  { day: "Tue", tokens: 77_000 },
  { day: "Wed", tokens: 68_000 },
  { day: "Thu", tokens: 100_000 },
  { day: "Fri", tokens: 90_000 },
  { day: "Sat", tokens: 42_000 },
  { day: "Sun", tokens: 31_000 },
];

const turns: ConsoleTurn[] = [
  { id: "1", role: "person", text: "Why was invoice 4821 charged twice?" },
  {
    id: "2",
    role: "agent",
    text: "The retry job ran after a timeout, so the card was charged at **10:02** and **10:04**. I can refund the second charge.",
    tools: [{ id: "t1", name: "billing.lookup", status: "done", args: { invoice: 4821, token: "sk_live_51Hx" }, result: { charges: 2 } }],
    sources: [
      { title: "Billing log", url: "https://www.example.com/billing/4821" },
      { title: "Retry policy", url: "https://www.example.com/docs/retries" },
    ],
  },
];

const done = () => new Promise<null>((r) => setTimeout(() => r(null), 400));

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-1 flex-col rounded-md bg-background px-3 py-2.5">
      <span className="text-caption font-semibold uppercase text-muted-foreground">{label}</span>
      <span className="text-callout font-semibold">{value}</span>
      <span className="text-caption text-muted-foreground">{hint}</span>
    </div>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-footnote">
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0 text-success" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
      {children}
    </li>
  );
}

function Controls() {
  const [message, setMessage] = React.useState("");
  return (
    <Card className="gap-3.5 p-4.5">
      <CardContent className="flex flex-col gap-3.5">
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Approve →</Button>
          <Button size="sm" variant="secondary">Secondary</Button>
          <Button size="sm" variant="ghost">Ghost</Button>
        </div>
        <div className="relative">
          <Input aria-label="Search agents" placeholder="Search agents" className="pr-9" />
          <svg viewBox="0 0 16 16" aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3.5 3.5" />
          </svg>
        </div>
        <div className="space-y-1">
          <Textarea aria-label="Message" placeholder="Message" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} />
          <p className="text-right text-caption text-muted-foreground tabular-nums">{message.length} / 4000</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge>Badge</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="accent">Pending</Badge>
          <RadioGroup defaultValue="once" aria-label="Scope" className="flex gap-2">
            <RadioGroupItem value="once" aria-label="Once" />
            <RadioGroupItem value="always" aria-label="Always" />
          </RadioGroup>
          <Checkbox defaultChecked aria-label="Notify me" />
          <Checkbox aria-label="Notify my team" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button size="sm" variant="outline" className="text-destructive">Revoke…</Button>
          <label className="flex items-center gap-2 text-footnote text-muted-foreground">
            Autopilot <Switch defaultChecked />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

function Usage() {
  return (
    <Card className="gap-3.5 p-4.5">
      <CardHeader>
        <CardTitle>Tokens this week</CardTitle>
        <CardDescription>Every agent, all models</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <BarChart title="Tokens this week" data={tokens} index="day" indexLabel="Day" series={[{ key: "tokens", label: "Tokens" }]} />
        <div className="flex gap-2.5">
          <Stat label="Ceiling" value="80% used" hint="Alert at 90%" />
          <Stat label="Pending" value="3 approvals" hint="Oldest 12 min" />
        </div>
        <Button size="sm" className="w-full" render={<Link href="/blocks/usage-limits" />}>View usage</Button>
      </CardContent>
    </Card>
  );
}

function Spend() {
  return (
    <Card className="gap-3.5 p-4.5">
      <CardContent className="flex flex-col gap-2.5">
        <span className="text-footnote text-muted-foreground">Spend this month</span>
        <span className="text-title-1 tabular-nums">$1,211.29</span>
        <Badge variant="secondary" className="self-start text-warning">72% of ceiling</Badge>
        <Progress value={72} aria-label="Ceiling used" />
        <dl className="m-0 flex flex-col gap-1.5 rounded-md bg-background px-3 py-2.5 text-footnote">
          {[["Support agent", "$684.10"], ["Reports agent", "$402.75"], ["Sandbox", "$124.44"]].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="m-0 font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function Ceiling() {
  return (
    <Card className="gap-3.5 p-4.5">
      <CardHeader>
        <CardTitle>Usage ceiling</CardTitle>
        <CardDescription>Stop agents before the month&apos;s budget runs out.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="showcase-ceiling">Monthly ceiling (USD)</Label>
          <Input id="showcase-ceiling" type="number" inputMode="numeric" min={100} max={10000} defaultValue={1500} />
        </div>
        <Progress value={30} aria-label="Spent of the ceiling" />
        <label className="flex items-center gap-2 text-footnote">
          <Switch defaultChecked /> Pause agents at the ceiling
        </label>
        <Button size="sm" className="w-full">Save ceiling</Button>
      </CardContent>
    </Card>
  );
}

function Frame() {
  return (
    <Card className="gap-3.5 p-4.5">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Billing panel</CardTitle>
        <Badge variant="accent">mf-frame</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {/* What an embedded remote looks like here; the docs have no second origin to embed live. */}
        <div className="rounded-md border border-dashed border-primary/50 bg-background p-2.5">
          <div className="flex flex-col gap-1.5 rounded-sm bg-surface p-2.5 text-footnote">
            <span className="text-caption text-muted-foreground">billing.example · sandboxed</span>
            <span className="flex justify-between">Open invoices <b className="tabular-nums">4</b></span>
            <Progress value={40} aria-label="Invoices paid" />
          </div>
        </div>
        <p className="text-caption text-muted-foreground">Another team&apos;s app inside yours, on its own origin. Height and events cross a typed bridge; tokens never do.</p>
      </CardContent>
    </Card>
  );
}

function Defended() {
  return (
    <Card className="gap-3.5 p-4.5">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>This page is defended</CardTitle>
        <Badge variant="secondary" className="text-success">5 / 5</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-footnote text-muted-foreground">What Aedis UI does on its own, before your backend says a word.</p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          <Check>Content-Security-Policy with script hashes</Check>
          <Check>Session in an HttpOnly cookie</Check>
          <Check>Idle timeout · 15 min</Check>
          <Check>Registry release signed and attested</Check>
          <Check>Agent output rendered as data</Check>
        </ul>
        <Link href="/security" className="focus-ring self-start rounded-xs text-footnote text-link underline-offset-4 hover:underline">Security by construction →</Link>
      </CardContent>
    </Card>
  );
}

function Notifications() {
  const rows = [
    ["approvals", "Approval requests", "When an agent waits for a person.", true],
    ["ceiling", "Ceiling alerts", "At 80% and 100% of the month.", true],
    ["digest", "Weekly digest", "Usage and spend, every Monday.", false],
  ] as const;
  return (
    <Card className="gap-3.5 p-4.5">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what reaches you.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.map(([id, title, text, on]) => (
          <div key={id} className="flex items-start gap-2.5">
            <Checkbox id={`showcase-${id}`} defaultChecked={on} className="mt-0.5" />
            <div className="flex flex-col">
              <Label htmlFor={`showcase-${id}`}>{title}</Label>
              <span className="text-caption text-muted-foreground">{text}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Ghost({ height }: { height: number }) {
  return (
    <div aria-hidden="true" className="rounded-xl border border-hairline bg-surface p-4 opacity-60" style={{ height }}>
      <div className="h-2.5 w-3/5 rounded-full bg-muted" />
      <div className="mt-3 h-7 w-11/12 rounded-sm bg-muted" />
      <div className="mt-3 h-2.5 w-4/5 rounded-full bg-muted" />
    </div>
  );
}

/**
 * Registry components composed into small screens, in five columns with faded ghost columns at the edges from 1440 px. Below that
 * the columns dissolve into a masonry of the same cards, and phones see the first few.
 */
export function Showcase() {
  const columns: React.ReactNode[][] = [
    [<Controls key="c" />, <Sidebar key="s" label="Workspace (example)" className="w-full rounded-xl" groups={[{ label: "Workspace", items: [{ href: "#agents", label: "Agents" }, { href: "#approvals", label: "Approvals", active: true, count: 3, countLabel: "3 waiting" }, { href: "#usage", label: "Usage" }, { href: "#audit", label: "Audit log" }, { href: "#settings", label: "Settings" }] }]} />],
    [<Usage key="u" />, <Spend key="s" />],
    [<ApprovalCard key="a" requester="Reports agent" requestedAt="2 min ago" content={"**Send the Q3 report outside the company**\n\nEmail `q3-report.pdf` to finance@partner.example and audit@partner.example."} onApprove={done} onRequestChanges={done} />, <Ceiling key="c" />],
    [<AgentConsole key="a" title="Support agent" turns={turns} onSend={async () => undefined} className="flex h-[34rem] w-full flex-col overflow-hidden rounded-xl border border-hairline bg-surface shadow-elevation-1" />, <Frame key="f" />],
    [<Defended key="d" />, <Notifications key="n" />],
  ];
  return (
    <section aria-label="Components in use" className="relative overflow-hidden pb-10 min-[1440px]:[mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
      <div className="mx-auto max-w-7xl columns-1 gap-4 px-4 sm:columns-2 md:px-6 lg:columns-3 min-[1440px]:ml-[calc(50%-893px)] min-[1440px]:grid min-[1440px]:w-[1786px] min-[1440px]:max-w-none min-[1440px]:grid-cols-[170px_repeat(5,272px)_170px] min-[1440px]:items-start min-[1440px]:px-0">
        <div className="hidden flex-col gap-4 min-[1440px]:flex">
          <Ghost height={240} />
          <Ghost height={320} />
          <Ghost height={200} />
        </div>
        {columns.map((cards, i) => (
          <div key={i} className="contents min-[1440px]:flex min-[1440px]:flex-col min-[1440px]:gap-4">
            {cards.map((card, j) => (
              <div key={j} className={i * 2 + j > 4 ? "mb-4 hidden break-inside-avoid sm:block min-[1440px]:mb-0" : "mb-4 break-inside-avoid min-[1440px]:mb-0"}>
                {card}
              </div>
            ))}
          </div>
        ))}
        <div className="hidden flex-col gap-4 min-[1440px]:flex">
          <Ghost height={280} />
          <Ghost height={240} />
          <Ghost height={260} />
        </div>
      </div>
    </section>
  );
}
