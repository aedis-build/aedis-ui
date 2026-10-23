import { Input } from "@/registry/aedis/ui/input";
import { Label } from "@/registry/aedis/ui/label";

export default function InputStates() {
  return (
    <div className="grid max-w-sm gap-4">
      <div className="grid gap-2">
        <Label htmlFor="ceiling">Daily ceiling</Label>
        <Input id="ceiling" inputMode="decimal" aria-invalid="true" aria-describedby="ceiling-error" defaultValue="-20" />
        <p id="ceiling-error" className="text-footnote text-destructive">Enter an amount above zero.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="tenant">Tenant</Label>
        <Input id="tenant" disabled defaultValue="acme" />
      </div>
    </div>
  );
}
