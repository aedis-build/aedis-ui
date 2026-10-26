"use client";

import * as React from "react";

import { stripInvisible } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useStickToBottom } from "@/registry/aedis/hooks/use-stick-to-bottom";
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
  /** Sends the text. The input clears right away; throw to put the text back and show the error. */
  onSend: (text: string) => Promise<void>;
  /** Shown while the agent works, e.g. "Rafael is working on it…". */
  working?: string;
  maxLength?: number;
  labels?: Partial<ChatLabels>;
  className?: string;
};

// Memoized: a new message or a keystroke must not parse every earlier message's markdown again.
const Message = React.memo(function Message({ message: m }: { message: ChatMessage }) {
  return (
    <div
      data-role={m.role}
      className={cn(
        "min-w-0 max-w-[85%] rounded-md border border-hairline px-3 py-2 text-callout break-words",
        m.role === "person" && "self-end bg-accent-soft",
        m.role === "agent" && "self-start bg-surface shadow-elevation-1",
        m.role === "system" && "self-center border-dashed border-border text-muted-foreground",
      )}
    >
      <p className="mb-1 text-caption text-muted-foreground">{m.author}</p>
      {m.role === "agent" ? <Markdown>{m.content}</Markdown> : <p className="whitespace-pre-wrap">{stripInvisible(m.content)}</p>}
    </div>
  );
});

/** A button over the end of a log the reader scrolled away from. */
export function JumpToLatest({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onClick}
      className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-surface shadow-elevation-2"
    >
      {label}
    </Button>
  );
}

function Chat({ messages, onSend, working, maxLength = 8000, labels, className }: ChatProps) {
  const l = useMessages("chat", labels);
  const { ref, atBottom, jump } = useStickToBottom<HTMLDivElement>();

  return (
    <div data-slot="chat" className={cn("flex min-h-0 min-w-0 flex-1 flex-col gap-3", className)}>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={ref} role="log" aria-live="polite" aria-label={l.log} className="scroll-fade-y flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden py-4">
          {messages.map((m) => <Message key={m.id} message={m} />)}
          {working ? <p className="text-footnote italic text-muted-foreground">{working}</p> : null}
        </div>
        {atBottom ? null : <JumpToLatest label={l.jumpToLatest} onClick={jump} />}
      </div>
      <Composer l={l} maxLength={maxLength} onSend={onSend} onSending={jump} />
    </div>
  );
}

/** The draft lives here, so typing re-renders only the composer. */
function Composer({ l, maxLength, onSend, onSending }: { l: ChatLabels; maxLength: number; onSend: ChatProps["onSend"]; onSending: () => void }) {
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState("");
  const box = React.useRef<HTMLTextAreaElement>(null);
  const button = React.useRef<HTMLButtonElement>(null);

  async function send(event?: React.FormEvent) {
    event?.preventDefault();
    // Hidden code points pasted into the draft would reach the agent unseen by the person who sent them.
    const text = stripInvisible(draft).trim();
    if (!text || sending) return;
    // The button disables once the draft is empty: keep focus in the composer instead of losing it to the page.
    if (document.activeElement === button.current) box.current?.focus();
    setDraft("");
    setNotice("");
    setSending(true);
    setError(null);
    onSending();
    try {
      await onSend(text);
    } catch {
      setError(l.sendError);
      // Put the text back, ahead of anything typed while it was sending.
      setDraft((typed) => (typed ? `${text}\n${typed}` : text));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <form onSubmit={send} className="flex items-end gap-2">
        <Textarea
          ref={box}
          aria-label={l.message}
          value={draft}
          maxLength={maxLength}
          placeholder={l.placeholder}
          className="max-h-60"
          onChange={(e) => setDraft(e.target.value)}
          onPaste={(e) => {
            const t = e.currentTarget;
            const room = maxLength - t.value.length + (t.selectionEnd - t.selectionStart);
            setNotice(e.clipboardData.getData("text").length > room ? l.truncated.replace("{max}", String(maxLength)) : "");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button ref={button} type="submit" disabled={sending || !draft.trim()}>
          {l.send}
        </Button>
      </form>
      <div className="flex gap-2 text-footnote text-muted-foreground">
        <p role="status">{notice}</p>
        {draft.length > maxLength * 0.9 ? <p className="ml-auto tabular-nums">{draft.length}/{maxLength}</p> : null}
      </div>
      {error ? (
        <p role="alert" className="text-callout text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { Chat };
