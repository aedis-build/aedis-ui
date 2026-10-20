"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { redactText } from "@/registry/aedis/lib/redact";
import { AccordionChevron } from "@/registry/aedis/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/aedis/ui/collapsible";
import { StreamingMarkdown } from "@/registry/aedis/ui/streaming-markdown";

export type ReasoningLabels = Messages["reasoning"];

export type ReasoningProps = {
  /** The model's reasoning, as untrusted markdown. Redacted like tool output. */
  children: string;
  /** Still thinking: the label pulses (static under reduced motion). */
  streaming?: boolean;
  /** How long it thought, for the label once done. */
  durationMs?: number;
  redactKeys?: string[];
  labels?: Partial<ReasoningLabels>;
  className?: string;
};

/** The agent's reasoning, collapsed until someone asks for it. */
function Reasoning({ children, streaming = false, durationMs, redactKeys, labels, className }: ReasoningProps) {
  const l = useMessages("reasoning", labels);
  const seconds = durationMs === undefined ? null : Math.max(1, Math.round(durationMs / 1000));
  const label = streaming ? l.thinking : seconds === null ? l.thought : l.thoughtFor.replace("{seconds}", String(seconds));
  return (
    <Collapsible data-slot="reasoning" className={cn("text-callout", className)}>
      <CollapsibleTrigger className="group focus-ring inline-flex items-center gap-1.5 rounded-xs text-muted-foreground hover:text-foreground">
        <span className={cn(streaming && "animate-pulse motion-reduce:animate-none")}>{label}</span>
        <AccordionChevron />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 border-l-2 border-border pl-3 text-muted-foreground">
          <StreamingMarkdown streaming={streaming}>{redactText(children, redactKeys)}</StreamingMarkdown>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { Reasoning };
