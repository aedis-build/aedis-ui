import { BarChart } from "@/registry/aedis/ui/bar-chart";

const approvals = [
  { day: "Mon", approved: 20, declined: 4 },
  { day: "Tue", approved: 26, declined: 6 },
  { day: "Wed", approved: 30, declined: 5 },
  { day: "Thu", approved: 24, declined: 8 },
  { day: "Fri", approved: 35, declined: 6 },
  { day: "Sat", approved: 11, declined: 2 },
  { day: "Sun", approved: 8, declined: 1 },
];

export default function BarChartDemo() {
  return (
    <BarChart
      title="Approvals per day"
      data={approvals}
      index="day"
      indexLabel="Day"
      series={[{ key: "approved", label: "Approved" }, { key: "declined", label: "Declined" }]}
      className="w-full max-w-lg"
    />
  );
}
