import { BarChart } from "@/registry/aedis/ui/bar-chart";

// Data straight from an untrusted source: the label is shown as characters and the bad values are dropped and counted.
const runs = [
  { agent: "Support", runs: 24 },
  { agent: "<img src=x onerror=alert(1)>", runs: 12 },
  { agent: "Reports", runs: Number.NaN },
  { agent: "Sandbox", runs: "9" },
];

export default function ChartDemo() {
  return <BarChart title="Runs by agent" data={runs} index="agent" indexLabel="Agent" series={[{ key: "runs", label: "Runs" }]} className="w-full max-w-lg" />;
}
