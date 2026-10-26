"use client";

import * as React from "react";

import { useStickToBottom } from "@/registry/aedis/hooks/use-stick-to-bottom";
import { useMessages } from "@/registry/aedis/lib/locale";
import { JumpToLatest } from "@/registry/aedis/ui/chat";
import { PromptInput, type PromptInputProps } from "@/registry/aedis/ui/prompt-input";
import { Sources, type Source } from "@/registry/aedis/ui/sources";
import { StreamingMarkdown } from "@/registry/aedis/ui/streaming-markdown";
import { ToolCall, type ToolCallProps } from "@/registry/aedis/ui/tool-call";

export type ConsoleTurn = {
  id: string;
  role: "person" | "agent";
  /** A person's text, or the agent's answer as untrusted markdown. */
  text: string;
  /** The agent is still writing this answer. */
  streaming?: boolean;
  tools?: (ToolCallProps & { id: string })[];
  sources?: Source[];
};

export type AgentConsoleProps = {
  title: string;
  turns: ConsoleTurn[];
  onSend: PromptInputProps["onSend"];
  className?: string;
};

// Memoized: while one answer streams, the turns before it keep their object and are not rendered again.
const Turn = React.memo(function Turn({ turn: t }: { turn: ConsoleTurn }) {
  return t.role === "person" ? (
    <p className="max-w-[80%] self-end whitespace-pre-wrap break-words rounded-lg bg-accent-soft px-4 py-2 text-callout">{t.text}</p>
  ) : (
    <article className="min-w-0 space-y-3">
      {t.tools?.map(({ id, ...tool }) => <ToolCall key={id} {...tool} />)}
      <StreamingMarkdown streaming={t.streaming}>{t.text}</StreamingMarkdown>
      {t.sources?.length ? <Sources sources={t.sources} idPrefix={`${t.id}-source`} /> : null}
    </article>
  );
});

/**
 * A conversation with an agent: answers stream in as safe markdown, tool calls show redacted arguments, sources show
 * their real domain, and Stop aborts the answer. Every piece keeps its own defenses; this only lays them out. The log
 * follows the answer while the reader is at its end, and offers a way back once they scroll up.
 */
export function AgentConsole({ title, turns, onSend, className }: AgentConsoleProps) {
  const l = useMessages("chat");
  const { ref, atBottom, jump } = useStickToBottom<HTMLDivElement>();
  const send = React.useCallback<PromptInputProps["onSend"]>((message, context) => {
    // Sending is a request to see the answer: follow it even if the reader had scrolled up.
    jump();
    return onSend(message, context);
  }, [jump, onSend]);

  return (
    <section aria-label={title} className={className ?? "flex h-[36rem] w-full flex-col rounded-xl border border-hairline bg-background"}>
      <header className="border-b border-hairline px-5 py-3 text-headline">{title}</header>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={ref} role="log" aria-live="polite" aria-label={title} className="scroll-fade-y flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-5">
          {turns.map((t) => <Turn key={t.id} turn={t} />)}
        </div>
        {atBottom ? null : <JumpToLatest label={l.jumpToLatest} onClick={jump} />}
      </div>
      <div className="border-t border-hairline p-3">
        <PromptInput onSend={send} />
      </div>
    </section>
  );
}
