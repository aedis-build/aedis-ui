import { Input } from "@/registry/aedis/ui/input";
import { Label } from "@/registry/aedis/ui/label";

export default function InputDemo() {
  return (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="name@company.com" />
    </div>
  );
}
