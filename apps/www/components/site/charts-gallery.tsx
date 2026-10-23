"use client";

import * as React from "react";
import Link from "next/link";

import { AreaChart } from "@/registry/aedis/ui/area-chart";
import { BarChart } from "@/registry/aedis/ui/bar-chart";
import { Card, CardDescription, CardHeader, CardTitle } from "@/registry/aedis/ui/card";
import { LineChart } from "@/registry/aedis/ui/line-chart";
import { PieChart } from "@/registry/aedis/ui/pie-chart";
import { RadialChart } from "@/registry/aedis/ui/radial-chart";
import { Tabs, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

// Sample data for the gallery. 30 days is derived, so the page has no random numbers between builds.
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const week = days.map((day, i) => ({ day, support: [42, 51, 47, 63, 58, 24, 19][i] * 1000, reports: [18, 22, 30, 27, 35, 12, 9][i] * 1000 }));
const month = Array.from({ length: 30 }, (_, i) => ({ day: String(i + 1), support: (40 + ((i * 7) % 23)) * 1000, reports: (15 + ((i * 5) % 17)) * 1000 }));
const approvals = days.map((day, i) => ({ day, approved: [20, 26, 30, 24, 35, 11, 8][i], declined: [4, 6, 5, 8, 6, 2, 1][i] }));
const latency = days.map((day, i) => ({ day, p95: [2.1, 1.8, 2.4, 1.6, 1.9, 1.4, 1.5][i] }));
const runs = days.map((day, i) => ({ day, runs: [14, 18, 16, 24, 21, 9, 7][i] }));
const spend = [{ model: "Large", usd: 669.4 }, { model: "Small", usd: 354.3 }, { model: "Embeddings", usd: 187.59 }];

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const types = ["All", "Area", "Bar", "Line", "Pie", "Radial", "Tooltip"] as const;
type Type = (typeof types)[number];

function ChartCard({ title, description, href, children, className }: { title: string; description: string; href: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          <Link href={href} className="focus-ring rounded-xs hover:underline">{title}</Link>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children}
    </Card>
  );
}

/** Every chart type with sample data, filtered by type. Each card is the registry component and links to its page. */
export function ChartsGallery() {
  const [type, setType] = React.useState<Type>("All");
  const [range, setRange] = React.useState("7d");
  const show = (t: Type) => type === "All" || type === t;
  return (
    <div className="space-y-4">
      <Tabs value={type} onValueChange={(v) => setType(v as Type)}>
        <TabsList aria-label="Chart type" className="h-auto flex-wrap justify-start">
          {types.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {show("Area") ? (
          <ChartCard title="Tokens by agent" description="Area · stacked" href="/docs/area-chart">
            <Tabs value={range} onValueChange={(v) => setRange(String(v))} className="-mt-2">
              <TabsList aria-label="Range" className="self-start">
                <TabsTrigger value="7d">7 days</TabsTrigger>
                <TabsTrigger value="30d">30 days</TabsTrigger>
              </TabsList>
            </Tabs>
            <AreaChart title={`Tokens by agent, last ${range === "7d" ? "7" : "30"} days`} data={range === "7d" ? week : month} index="day" indexLabel="Day" stacked series={[{ key: "support", label: "Support" }, { key: "reports", label: "Reports" }]} />
          </ChartCard>
        ) : null}
        {show("Bar") ? (
          <ChartCard title="Approvals per day" description="Bar · approved vs declined" href="/docs/bar-chart">
            <BarChart title="Approvals per day" data={approvals} index="day" indexLabel="Day" series={[{ key: "approved", label: "Approved" }, { key: "declined", label: "Declined" }]} />
          </ChartCard>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {show("Line") ? (
          <ChartCard title="Agent latency p95" description="Line · seconds" href="/docs/line-chart">
            <LineChart title="Agent latency p95" data={latency} index="day" indexLabel="Day" series={[{ key: "p95", label: "p95" }]} format={(s) => `${s.toFixed(1)} s`} />
          </ChartCard>
        ) : null}
        {show("Pie") ? (
          <ChartCard title="Spend by model" description="Pie · donut" href="/docs/pie-chart">
            <PieChart title="Spend by model" data={spend} index="model" value={{ key: "usd", label: "Spend" }} center={usd(1211.29)} format={usd} />
          </ChartCard>
        ) : null}
        {show("Radial") ? (
          <ChartCard title="Ceiling used" description="Radial" href="/docs/radial-chart">
            <RadialChart title="Ceiling used" value={1080} max={1500} caption="of $1,500" />
            <p className="text-center text-caption text-muted-foreground">Alert at 90%</p>
          </ChartCard>
        ) : null}
        {show("Tooltip") ? (
          <ChartCard title="Tooltip" description="Keyboard and pointer, text only. Tab to the chart, then use the arrow keys." href="/docs/chart">
            <AreaChart title="Runs per day" data={runs} index="day" indexLabel="Day" series={[{ key: "runs", label: "Runs" }]} />
          </ChartCard>
        ) : null}
      </div>
    </div>
  );
}
