import { Badge } from "@/registry/aedis/ui/badge";

export default function BadgeStatus() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="status" tone="ok">
        Compliant · 15/11/2026
      </Badge>
      <Badge variant="status" tone="attention">
        2 awaiting review
      </Badge>
      <Badge variant="status" tone="neutral">
        Draft
      </Badge>
    </div>
  );
}
