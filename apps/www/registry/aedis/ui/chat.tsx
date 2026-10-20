"use client";

import * as React from "react";

import { stripInvisible } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Button } from "@/registry/aedis/ui/button";
import { Markdown } from "@/registry/aedis/ui/markdown";
import { Textarea } from "@/registry/aedis/ui/textarea";

export type ChatMessage = {
  id: string | number;
  /** Display name of who wrote it. */
  author: string;
  role: "person" | "agent" | "system";
  /** Markdown for agents, plain text for people and system messages. Always untrusted. */
  content: string;
};

export type ChatLabels = Messages["chat"];

export type ChatProps = {
  messages: ChatMessage[];
  /** Sends the text. Throw to keep the draft and show the error. */
  onSend: (text: string) => Promise<void>;
  /** Shown while the agent works, e.g. "Rafael is working on it…". */
  working?: string;
  maxLength?: number;
  labels?: Partial<ChatLabels>;
  className?: string;
};

function Chat({ messages, onSend, working, maxLength = 8000, labels, className }: ChatProps) {
  const l = useMessages("chat", labels);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const end = React.useRef<HTMLDivElement>(null);

  // Braces on purpose: scrollIntoView returns a Promise in recent Chromium, which React would treat as a cleanup.
  React.useEffect(() => {
    end.current?.scrollIntoView?.({ block: "end" });
  }, [messages.length, working]);

  async function send(event?: React.FormEvent) {
    event?.preventDefault();
    // Hidden code points pasted into the draft would reach the agent unseen by the person who sent them.
    const text = stripInvisible(draft).trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(text);
      setDraft("");
    } catch {
      setError(l.sendError);
    } finally {
      setSending(false);
    }
  }

  return (
    <div data-slot="chat" className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      <div role="log" aria-live="polite" aria-label={l.log} className="scroll-fade-y flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            data-role={m.role}
            className={cn(
              "max-w-[85%] rounded-md border border-hairline px-3 py-2 text-callout",
              m.role === "person" && "self-end bg-accent-soft",
              m.role === "agent" && "self-start bg-surface shadow-elevation-1",
              m.role === "system" && "self-center border-dashed border-border text-muted-foreground",
            )}
          >
            <p className="mb-1 text-caption text-muted-foreground">{m.author}</p>
            {m.role === "agent" ? <Markdown>{m.content}</Markdown> : <p className="whitespace-pre-wrap break-words">{stripInvisible(m.content)}</p>}
          </div>
        ))}
        {working ? <p className="text-footnote italic text-muted-foreground">{working}</p> : null}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="flex items-end gap-2">
        <Textarea
          aria-label={l.message}
          value={draft}
          maxLength={maxLength}
          placeholder={l.placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button type="submit" disabled={sending || !draft.trim()}>
          {l.send}
        </Button>
      </form>
      {error ? (
        <p role="alert" className="text-callout text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { Chat };
