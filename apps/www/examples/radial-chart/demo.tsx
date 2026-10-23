import { RadialChart } from "@/registry/aedis/ui/radial-chart";

export default function RadialChartDemo() {
  return <RadialChart title="Ceiling used" value={1080} max={1500} caption="of $1,500" />;
}
