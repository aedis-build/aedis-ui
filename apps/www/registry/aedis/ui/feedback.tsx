"use client";

import * as React from "react";

import { api } from "@/lib/api";
import { stripInvisible } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Button } from "@/registry/aedis/ui/button";
import { Textarea } from "@/registry/aedis/ui/textarea";

export type FeedbackLabels = Messages["feedback"];
export type FeedbackRating = "positive" | "negative";

export type FeedbackProps = {
  /** The answer being rated, from the app. People never type it. */
  messageId: string;
  /** Same-origin endpoint; receives { messageId, rating, comment? } as JSON through api(). */
  endpoint: string;
  /** Longest comment accepted. */
  maxLength?: number;
  labels?: Partial<FeedbackLabels>;
  className?: string;
};

const thumb = "M5.5 7 8 2.5a1.5 1.5 0 0 1 1.5 1.5v2.5h3a1 1 0 0 1 1 1.2l-1 5a1 1 0 0 1-1 .8H5.5M5.5 7v6.5M5.5 7H3a.5.5 0 0 0-.5.5v5.5a.5.5 0 0 0 .5.5h2.5";

/** Thumbs up or down on an agent answer, with an optional comment. */
function Feedback({ messageId, endpoint, maxLength = 1000, labels, className }: FeedbackProps) {
  const l = useMessages("feedback", labels);
  const [rating, setRating] = React.useState<FeedbackRating | null>(null);
  const [comment, setComment] = React.useState("");
  const [state, setState] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const commentId = React.useId();

  async function send(chosen: FeedbackRating, text?: string) {
    setState("sending");
    try {
      const clean = text === undefined ? undefined : stripInvisible(text).trim().slice(0, maxLength) || undefined;
      await api(endpoint, { body: { messageId, rating: chosen, ...(clean ? { comment: clean } : {}) } });
      setState("sent");
    } catch {
      setState("error");
    }
  }

  function choose(r: FeedbackRating) {
    setRating(r);
    setState("idle");
    // A thumbs up is complete on its own; a thumbs down asks what went wrong first.
    if (r === "positive") void send(r);
  }

  const done = state === "sent";
  return (
    <div data-slot="feedback" className={cn("flex flex-col gap-2 text-footnote", className)}>
      <div role="group" aria-label={l.label} className="flex items-center gap-1">
        {(["positive", "negative"] as const).map((r) => (
          <Button
            key={r}
            variant="ghost"
            size="icon"
            aria-label={r === "positive" ? l.positive : l.negative}
            aria-pressed={rating === r}
            // Not disabled: the thumb that was pressed keeps the focus while it sends and after.
            pending={state === "sending"}
            aria-disabled={done || undefined}
            onClick={() => !done && choose(r)}
            className="size-8 text-muted-foreground aria-pressed:bg-accent-soft aria-pressed:text-foreground"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className={cn(r === "negative" && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d={thumb} />
            </svg>
          </Button>
        ))}
        <span role="status" className={cn("ml-1 text-muted-foreground", done && "transition-opacity duration-(--duration-base) ease-cinematic starting:opacity-0 motion-reduce:transition-none")}>
          {done ? l.thanks : state === "error" ? l.error : ""}
        </span>
      </div>
      {rating === "negative" && !done ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send("negative", comment);
          }}
        >
          <label htmlFor={commentId} className="text-muted-foreground">{l.comment}</label>
          <Textarea id={commentId} value={comment} maxLength={maxLength} rows={2} onChange={(e) => setComment(e.target.value)} placeholder={l.placeholder} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" pending={state === "sending"}>{l.send}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => void send("negative")} pending={state === "sending"}>{l.skip}</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export { Feedback };
