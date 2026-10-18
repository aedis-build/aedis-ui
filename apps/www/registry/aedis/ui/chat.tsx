"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
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

export type ChatLabels = {
  placeholder: string;
  send: string;
  message: string;
  log: string;
  sendError: string;
};

const defaultLabels: ChatLabels = {
  placeholder: "Write a message",
  send: "Send",
  message: "Message",
  log: "Conversation",
  sendError: "The message could not be sent. Try again.",
};

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
  const l = { ...defaultLabels, ...labels };
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
    const text = draft.trim();
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
      <div role="log" aria-live="polite" aria-label={l.log} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            data-role={m.role}
            className={cn(
              "max-w-[85%] rounded-xl border border-border px-3 py-2 text-sm",
              m.role === "person" && "self-end bg-secondary",
              m.role === "agent" && "self-start bg-background",
              m.role === "system" && "self-center border-dashed text-muted-foreground",
            )}
          >
            <p className="mb-1 text-xs font-medium text-muted-foreground">{m.author}</p>
            {m.role === "agent" ? <Markdown>{m.content}</Markdown> : <p className="whitespace-pre-wrap break-words">{m.content}</p>}
          </div>
        ))}
        {working ? <p className="text-sm italic text-muted-foreground">{working}</p> : null}
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
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { Chat };
