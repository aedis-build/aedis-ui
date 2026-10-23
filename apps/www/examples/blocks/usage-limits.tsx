import { UsageLimits } from "@/registry/aedis/blocks/usage-limits";

export default function UsageLimitsDemo() {
  return (
    <UsageLimits
      currency="USD"
      period="Today"
      agents={[
        { id: "sales", name: "Sales agent", spent: 12.4, ceiling: 40 },
        { id: "support", name: "Support agent", spent: 34.1, ceiling: 40 },
        { id: "research", name: "Research agent", spent: 25, ceiling: 25 },
        { id: "social", name: "Social media agent", spent: 3.2, ceiling: 20 },
      ]}
    />
  );
}
