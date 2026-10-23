import { Reasoning } from "@/registry/aedis/ui/reasoning";
import { ToolCall } from "@/registry/aedis/ui/tool-call";

export default function ToolCallDemo() {
  return (
    <div className="grid gap-3">
      <ToolCall name="crm.lookup" status="done" args={{ email: "ana@acme.com", apiKey: "sk_live_123" }} result={{ name: "Ana", plan: "Pro" }} />
      <ToolCall name="calendar.search" status="running" args={{ week: "2026-W43" }} />
      <Reasoning durationMs={3800}>{"The client asked for four days. Check the calendar first, then draft the proposal with token=abc123 redacted."}</Reasoning>
    </div>
  );
}
