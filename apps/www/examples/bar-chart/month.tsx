import { BarChart } from "@/registry/aedis/ui/bar-chart";

// Thirty days of runs, deterministic so the page renders the same every time.
const days = Array.from({ length: 30 }, (_, i) => ({ day: `Oct ${i + 1}`, runs: 40 + ((i * 37) % 60) }));

export default function BarChartMonth() {
  return <BarChart title="Agent runs in October" data={days} index="day" indexLabel="Day" series={[{ key: "runs", label: "Runs" }]} className="w-full max-w-lg" />;
}
