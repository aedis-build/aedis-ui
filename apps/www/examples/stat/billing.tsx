import { Stat, StatGroup } from "@/registry/aedis/ui/stat";

export default function StatBilling() {
  return (
    <StatGroup aria-label="Billing" stack className="w-full max-w-sm">
      <Stat label="Plan usage this month" value={13041} total={50000} delta="Free plan" />
    </StatGroup>
  );
}
