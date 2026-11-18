import { Stat, StatGroup } from "@/registry/aedis/ui/stat";

export default function StatDemo() {
  return (
    <StatGroup aria-label="Identity" className="w-full">
      <Stat label="People active this month" value={12480} delta="+4% from last month" />
      <Stat label="Agents" value={18} />
      <Stat label="Organizations" value={214} />
      <Stat label="Approvals pending" value={3} action={{ href: "/docs/approval-card", label: "Review approvals" }} />
    </StatGroup>
  );
}
