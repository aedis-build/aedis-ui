import { Skeleton } from "@/registry/aedis/ui/skeleton";

export default function SkeletonDemo() {
  return (
    <div role="status" className="max-w-sm space-y-2" aria-busy="true" aria-label="Loading team">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
