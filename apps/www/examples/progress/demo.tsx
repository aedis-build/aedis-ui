import { Progress } from "@/registry/aedis/ui/progress";

export default function ProgressDemo() {
  return (
    <Progress value={62} aria-label="Ceiling used" className="max-w-sm" />
  );
}
