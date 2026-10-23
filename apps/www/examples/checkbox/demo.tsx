import { Checkbox } from "@/registry/aedis/ui/checkbox";
import { Label } from "@/registry/aedis/ui/label";

export default function CheckboxDemo() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="can-approve" />
      <Label htmlFor="can-approve">Can approve what their team sends out</Label>
    </div>
  );
}
