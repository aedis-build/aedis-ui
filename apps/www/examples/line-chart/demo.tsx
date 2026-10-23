"use client";

import { LineChart } from "@/registry/aedis/ui/line-chart";

const latency = [
  { day: "Mon", p95: 2.1 },
  { day: "Tue", p95: 1.8 },
  { day: "Wed", p95: 2.4 },
  { day: "Thu", p95: 1.6 },
  { day: "Fri", p95: 1.9 },
  { day: "Sat", p95: 1.4 },
  { day: "Sun", p95: 1.5 },
];

export default function LineChartDemo() {
  return (
    <LineChart
      title="Agent latency p95"
      data={latency}
      index="day"
      indexLabel="Day"
      series={[{ key: "p95", label: "p95" }]}
      format={(s) => `${s.toFixed(1)} s`}
      className="w-full max-w-lg"
    />
  );
}
