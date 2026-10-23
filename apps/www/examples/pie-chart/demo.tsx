"use client";

import { PieChart } from "@/registry/aedis/ui/pie-chart";

const spend = [
  { model: "Large", usd: 669.4 },
  { model: "Small", usd: 354.3 },
  { model: "Embeddings", usd: 187.59 },
];

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function PieChartDemo() {
  return (
    <PieChart title="Spend by model" data={spend} index="model" value={{ key: "usd", label: "Spend" }} center={usd(1211.29)} format={usd} />
  );
}
