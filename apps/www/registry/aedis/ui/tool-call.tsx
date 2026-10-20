"use client";

import * as React from "react";

import { stripInvisible } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { redact } from "@/registry/aedis/lib/redact";
import { AccordionChevron } from "@/registry/aedis/ui/accordion";
import { ApprovalCard, type ApprovalCardProps } from "@/registry/aedis/ui/approval-card";
import { CodeBlock } from "@/registry/aedis/ui/code-block";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/aedis/ui/collapsible";
import { Spinner } from "@/registry/aedis/ui/spinner";

export type ToolCallLabels = Messages["toolCall"];
export type ToolCallStatus = "running" | "done" | "error" | "awaiting-approval";

export type ToolCallProps = {
  /** The tool's name as the agent called it. */
  name: string;
  /** Arguments the agent passed. Redacted and shown as JSON text. */
  args?: unknown;
  /** What came back. Redacted and shown as JSON text. */
  result?: unknown;
  status: ToolCallStatus;
  /** The tool acts outside (sends, pays, deletes): it waits in an ApprovalCard while awaiting approval. */
  external?: boolean;
  approval?: Pick<ApprovalCardProps, "requester" | "onApprove" | "onRequestChanges" | "requestedAt">;
  /** Key names to redact, replacing the default list (password, token, secret, authorization, …). */
  redactKeys?: string[];
  defaultOpen?: boolean;
  labels?: Partial<ToolCallLabels>;
  className?: string;
};

const json = (value: unknown, keys?: string[]) => JSON.stringify(redact(value, keys ? { keys } : {}), null, 2) ?? String(value);

/** A fence longer than any run of backticks in the text, so JSON can never close it early. */
const fence = (text: string) => "`".repeat(Math.max(3, ...[...text.matchAll(/`+/g)].map((m) => m[0].length + 1)));

function StatusIcon({ status, l }: { status: ToolCallStatus; l: ToolCallLabels }) {
  if (status === "running") return <Spinner labels={{ label: l.running }} className="text-muted-foreground" />;
  const icon = status === "done" ? "M3.5 8.5l3 3 6-7" : status === "error" ? "m5 5 6 6M11 5l-6 6" : "M8 4.5v4l2.5 1.5";
  const tone = status === "done" ? "text-success" : status === "error" ? "text-destructive" : "text-warning";
  return (
    <span className={cn("inline-flex items-center gap-1.5", tone)}>
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        {status === "awaiting-approval" ? <circle cx="8" cy="8" r="6" /> : null}
        <path d={icon} />
      </svg>
      <span className="text-footnote">{status === "done" ? l.done : status === "error" ? l.error : l.awaiting}</span>
    </span>
  );
}

/** Which tool an agent ran, with what and what came back. Everything is shown as data, after redaction. */
function ToolCall({ name, args, result, status, external = false, approval, redactKeys, defaultOpen = false, labels, className }: ToolCallProps) {
  const l = useMessages("toolCall", labels);
  const tool = stripInvisible(name);
  const argsText = args === undefined ? null : json(args, redactKeys);
  const resultText = result === undefined ? null : json(result, redactKeys);
  const waiting = status === "awaiting-approval";

  return (
    <div data-slot="tool-call" data-status={status} className={cn("rounded-md border border-hairline bg-surface text-callout shadow-elevation-1", className)}>
      <Collapsible defaultOpen={defaultOpen}>
        <CollapsibleTrigger className="group focus-ring flex w-full items-center gap-3 rounded-md px-4 py-3 text-left">
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9.5 2.5a3 3 0 0 0-3.9 3.9L2.5 9.5v2.5h2.5l3.1-3.1a3 3 0 0 0 3.9-3.9l-1.8 1.8-1.5-.4-.4-1.5Z" />
          </svg>
          <span className="min-w-0 flex-1 truncate font-mono text-footnote">{tool}</span>
          {external ? <span className="rounded-xs border border-border-control px-1.5 text-caption text-muted-foreground">{l.external}</span> : null}
          <StatusIcon status={status} l={l} />
          <AccordionChevron />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 px-4 pb-4">
            {argsText !== null ? (
              <section className="space-y-1.5">
                <h4 className="text-caption uppercase text-muted-foreground">{l.arguments}</h4>
                <CodeBlock lang="json" code={argsText} />
              </section>
            ) : null}
            {resultText !== null ? (
              <section className="space-y-1.5">
                <h4 className="text-caption uppercase text-muted-foreground">{l.result}</h4>
                <CodeBlock lang="json" code={resultText} />
              </section>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
      {waiting && external ? (
        <div className="px-4 pb-4">
          {approval ? (
            <ApprovalCard
              {...approval}
              content={`**${tool.replace(/[*_`[\]\\]/g, "\\$&")}** ${l.wantsToRun}${argsText ? `\n\n${fence(argsText)}json\n${argsText}\n${fence(argsText)}` : ""}`}
            />
          ) : (
            <p role="status" className="text-footnote text-warning">{l.waiting}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export { ToolCall };
