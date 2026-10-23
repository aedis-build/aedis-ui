import { Badge } from "@/registry/aedis/ui/badge";

export default function BadgeDemo() {
  return (
    <div className="flex gap-2">
      <Badge>Junior</Badge>
      <Badge variant="secondary">24/7</Badge>
      <Badge variant="accent">Hand raised</Badge>
      <Badge variant="outline">Slack</Badge>
    </div>
  );
}
