"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Markdown } from "@/registry/aedis/ui/markdown";

/** Longest answer rendered; the rest is cut so a runaway stream cannot freeze the page. */
export const MAX_STREAMING_LENGTH = 100_000;

// A link whose target is still being written: [text](partial-url   or   [text](   at the very end.
const OPEN_LINK = /!?\[([^\]\n]*)\]\([^)\s]*$/;
// A bare URL at the very end, which GFM would turn into a link before it is complete.
const OPEN_URL = /(^|\s)((?:https?:\/\/|www\.)\S*)$/i;
// Emphasis or code markers dangling at the end ("**bol", "`co"): shown once they close.
const DANGLING = /(\*{1,3}|_{1,3}|~{2}|`)([^*_~`\n]*)$/;

/**
 * What to render while text is still arriving: nothing that could become a link is clickable until it is complete,
 * and dangling markers do not flash as raw syntax.
 */
export function settledMarkdown(text: string): string {
  let out = text.replace(OPEN_LINK, (_m, label: string) => label).replace(OPEN_URL, "$1");
  const dangling = DANGLING.exec(out);
  // snake_case: an underscore inside a word is not emphasis.
  if (dangling && !(dangling[1][0] === "_" && /\w/.test(out[dangling.index - 1] ?? ""))) {
    const marker = dangling[1];
    const before = out.slice(0, dangling.index);
    const opened = before.split(marker).length - 1;
    // An odd number of markers before means this one closes an emphasis: keep it.
    if (opened % 2 === 0) out = before + dangling[2];
  }
  return out;
}

/**
 * Splits text that is still arriving at its last blank line outside a code fence: the head is complete and is parsed
 * once, only the tail is parsed again as tokens arrive.
 * shortcut: a block that spans a blank line (a loose list's indented continuation) can render apart until the stream
 * ends, when the whole text is parsed as one; parse incrementally if that ever shows.
 */
export function splitSettled(text: string): [string, string] {
  const end = text.trimEnd();
  let cut = end.lastIndexOf("\n\n");
  while (cut > 0 && (end.slice(0, cut).match(/^ {0,3}(```|~~~)/gm)?.length ?? 0) % 2) cut = end.lastIndexOf("\n\n", cut - 1);
  return cut > 0 ? [text.slice(0, cut), text.slice(cut + 2)] : ["", text];
}

export type StreamingMarkdownProps = {
  /** The answer so far, as untrusted markdown. Grows while `streaming`. */
  children: string;
  /** True while tokens are still arriving: shows the caret and holds back incomplete links. */
  streaming?: boolean | undefined;
  allowImages?: boolean | undefined;
  maxLength?: number;
  className?: string;
};

/**
 * Markdown for an answer that arrives token by token, rendered at most once per animation frame. Only the paragraph
 * being written is parsed again; the ones before it are parsed once.
 */
function StreamingMarkdown({ children, streaming = false, allowImages, maxLength = MAX_STREAMING_LENGTH, className }: StreamingMarkdownProps) {
  const [frame, setFrame] = React.useState(children);

  React.useEffect(() => {
    if (typeof requestAnimationFrame === "undefined") return setFrame(children);
    const id = requestAnimationFrame(() => setFrame(children));
    return () => cancelAnimationFrame(id);
  }, [children]);

  const capped = frame.slice(0, maxLength);
  const [head, tail] = streaming ? splitSettled(capped) : ["", capped];

  return (
    <div data-slot="streaming-markdown" aria-busy={streaming || undefined} className={cn("space-y-2", streaming && "stream-caret", className)}>
      {head ? <Markdown allowImages={allowImages}>{head}</Markdown> : null}
      <Markdown allowImages={allowImages}>{streaming ? settledMarkdown(tail) : tail}</Markdown>
    </div>
  );
}

export { StreamingMarkdown };
