import { Label } from "@/registry/aedis/ui/label";
import { Switch } from "@/registry/aedis/ui/switch";

export default function SwitchDemo() {
  return (
    <div className="flex items-center gap-2">
      <Switch id="whatsapp" defaultChecked />
      <Label htmlFor="whatsapp">WhatsApp</Label>
    </div>
  );
}
