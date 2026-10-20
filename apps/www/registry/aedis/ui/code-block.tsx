"use client";

import * as React from "react";

import { INVISIBLE } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { highlight, type CodeToken } from "@/registry/aedis/lib/highlight";
import { useReducedMotion } from "@/registry/aedis/hooks/use-reduced-motion";
import { Button } from "@/registry/aedis/ui/button";

export type CodeBlockLabels = Messages["codeBlock"];

export type CodeBlockProps = {
  /** The code, shown as text. Copy always copies exactly this. */
  code: string;
  /** Language for highlighting, e.g. "ts", "bash". Unknown languages are shown as plain text. */
  lang?: string;
  /** Shown above the code, e.g. a file name. */
  title?: string;
  /** Quickstart effect: lines are revealed one by one when the block scrolls into view, once. */
  animated?: boolean;
  /** Time between two lines when animated, in ms. */
  lineDelay?: number;
  labels?: Partial<CodeBlockLabels>;
  className?: string;
};

const SPLIT = new RegExp(`(${INVISIBLE.source})`, "u");
const codePoint = (c: string) => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`;

/**
 * Bidi controls and zero-width characters are shown as a visible marker instead of being removed: removing them would
 * change the code, showing them defeats Trojan Source (CVE-2021-42574).
 */
function Visible({ text, hidden }: { text: string; hidden: string }) {
  return text.split(SPLIT).map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} data-slot="code-block-hidden" title={`${hidden} ${codePoint(part)}`} className="rounded-xs bg-destructive-solid px-0.5 text-caption text-destructive-foreground">
        {codePoint(part)}
      </mark>
    ) : (
      part
    ),
  );
}

/** Code with token highlighting, a copy button and an optional line-by-line reveal. */
function CodeBlock({ code, lang = "text", title, animated = false, lineDelay = 120, labels, className }: CodeBlockProps) {
  const l = useMessages("codeBlock", labels);
  const reduced = useReducedMotion();
  const [tokens, setTokens] = React.useState<CodeToken[][] | null>(null);
  const [copy, setCopy] = React.useState<"idle" | "copied" | "failed">("idle");
  const lines = React.useMemo(() => code.replace(/\n$/, "").split("\n"), [code]);
  const [revealed, setRevealed] = React.useState(animated ? 0 : lines.length);
  const root = React.useRef<HTMLDivElement>(null);
  const done = !animated || reduced || revealed >= lines.length;

  React.useEffect(() => {
    let live = true;
    highlight(code.replace(/\n$/, ""), lang).then((t) => live && setTokens(t), () => live && setTokens(null));
    return () => {
      live = false;
    };
  }, [code, lang]);

  React.useEffect(() => {
    if (!animated || reduced || !root.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(lines.length);
      return;
    }
    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      timer = setInterval(() => setRevealed((n) => (n + 1 >= lines.length ? (clearInterval(timer), lines.length) : n + 1)), lineDelay);
      setRevealed(1);
    });
    observer.observe(root.current);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [animated, reduced, lines.length, lineDelay]);

  React.useEffect(() => {
    if (copy === "idle") return;
    const t = setTimeout(() => setCopy("idle"), 1500);
    return () => clearTimeout(t);
  }, [copy]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  }

  return (
    <div ref={root} data-slot="code-block" className={cn("group relative overflow-hidden rounded-md border border-hairline bg-(--syntax-background) text-(--syntax-foreground) shadow-elevation-1", className)}>
      {title ? <div className="border-b border-hairline px-4 py-2 font-mono text-footnote text-muted-foreground">{title}</div> : null}
      <Button variant="ghost" size="icon" aria-label={l.copy} onClick={onCopy} className="absolute top-1.5 right-1.5 size-8 text-muted-foreground">
        {copy === "copied" ? (
          <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3.5 8.5l3 3 6-7" /></svg>
        ) : (
          <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" /></svg>
        )}
      </Button>
      <span role="status" className="sr-only">{copy === "copied" ? l.copied : copy === "failed" ? l.copyFailed : ""}</span>
      <pre className="overflow-x-auto py-3 pr-12 pl-4 font-mono text-code">
        <code>
          {lines.map((line, i) => {
            const shown = done || i < revealed;
            return (
              <span
                key={i}
                data-slot="code-block-line"
                data-shown={shown || undefined}
                className={cn("block min-h-[1lh]", animated && "reveal-line")}
              >
                {tokens?.[i]
                  ? tokens[i].map((t, j) => (
                      <span key={j} style={{ color: t.color }}>
                        <Visible text={t.content} hidden={l.hidden} />
                      </span>
                    ))
                  : <Visible text={line} hidden={l.hidden} />}
                {!done && i === revealed - 1 ? <span aria-hidden="true" data-slot="code-block-cursor" className="caret ml-0.5 inline-block h-[1.1em] w-[0.55em] translate-y-[0.15em] bg-foreground" /> : null}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

export { CodeBlock };
