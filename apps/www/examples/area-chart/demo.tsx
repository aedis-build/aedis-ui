import { AreaChart } from "@/registry/aedis/ui/area-chart";

const tokens = [
  { day: "Mon", support: 42_000, reports: 18_000 },
  { day: "Tue", support: 51_000, reports: 22_000 },
  { day: "Wed", support: 47_000, reports: 30_000 },
  { day: "Thu", support: 63_000, reports: 27_000 },
  { day: "Fri", support: 58_000, reports: 35_000 },
  { day: "Sat", support: 24_000, reports: 12_000 },
  { day: "Sun", support: 19_000, reports: 9_000 },
];

export default function AreaChartDemo() {
  return (
    <AreaChart
      title="Tokens by agent"
      data={tokens}
      index="day"
      indexLabel="Day"
      stacked
      series={[{ key: "support", label: "Support" }, { key: "reports", label: "Reports" }]}
      className="w-full max-w-lg"
    />
  );
}
