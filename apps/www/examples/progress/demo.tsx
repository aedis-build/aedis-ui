import { Progress } from "@/registry/aedis/ui/progress";

export default function ProgressDemo() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Progress value={62} aria-label="Ceiling used" />
      {/* value={null}: the total is not known yet. */}
      <Progress value={null} aria-label="Indexing the knowledge base" />
    </div>
  );
}
