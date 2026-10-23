import { ScrollArea } from "@/registry/aedis/ui/scroll-area";

export default function ScrollAreaDemo() {
  return (
    <ScrollArea aria-label="Release notes" className="h-40 w-full max-w-md rounded-md border border-hairline bg-surface">
      <ul className="space-y-2 p-4 text-callout">
        {Array.from({ length: 20 }, (_, i) => (
          <li key={i}>Release 0.{20 - i}: security fixes and new components.</li>
        ))}
      </ul>
    </ScrollArea>
  );
}
