import { Button } from "@/registry/aedis/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/registry/aedis/ui/empty";

export default function EmptyDemo() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="6" r="2.5" /><path d="M3.5 13.5a4.5 4.5 0 0 1 9 0" /></svg>
        </EmptyMedia>
        <EmptyTitle>No agents yet</EmptyTitle>
        <EmptyDescription>Hire your first agent to start handing off work.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Hire an agent</Button>
      </EmptyContent>
    </Empty>
  );
}
