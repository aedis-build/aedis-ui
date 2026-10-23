import { Separator } from "@/registry/aedis/ui/separator";

export default function SeparatorDemo() {
  return (
    <div className="max-w-sm space-y-2 text-sm">
      <p>Plan</p>
      <Separator />
      <p>This week</p>
    </div>
  );
}
