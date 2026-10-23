import { Label } from "@/registry/aedis/ui/label";
import { RadioGroup, RadioGroupItem } from "@/registry/aedis/ui/radio-group";

export default function RadioGroupDemo() {
  return (
    <RadioGroup defaultValue="case" aria-label="Scope">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="case" id="case" />
        <Label htmlFor="case">Just this case</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="always" id="always" />
        <Label htmlFor="always">Always</Label>
      </div>
    </RadioGroup>
  );
}
