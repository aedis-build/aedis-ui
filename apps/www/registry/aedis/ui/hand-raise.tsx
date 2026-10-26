"use client";

import * as React from "react";

import { stripInvisible } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Button } from "@/registry/aedis/ui/button";
import { Label } from "@/registry/aedis/ui/label";
import { RadioGroup, RadioGroupItem } from "@/registry/aedis/ui/radio-group";
import { Textarea } from "@/registry/aedis/ui/textarea";

export type HandRaiseScope = "once" | "always";

export type HandRaiseLabels = Messages["handRaise"];

export type HandRaiseProps = {
  /** The agent asking. */
  agent: string;
  /** The question, as plain text. */
  question: string;
  /** What the agent already tried (knowledge base, colleagues). */
  tried?: string | null;
  /** Answer. Resolve with an error message to show it, or null on success. */
  onAnswer: (answer: string, scope: HandRaiseScope) => Promise<string | null>;
  labels?: Partial<HandRaiseLabels>;
  className?: string;
};

/** A question an agent could not resolve alone, answered for this case or as a lasting rule. */
function HandRaise({ agent, question, tried, onAnswer, labels, className }: HandRaiseProps) {
  const l = useMessages("handRaise", labels);
  const id = React.useId();
  const [answer, setAnswer] = React.useState("");
  const [scope, setScope] = React.useState<HandRaiseScope>("once");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [answered, setAnswered] = React.useState<{ text: string; scope: HandRaiseScope } | null>(null);
  const inFlight = React.useRef(false);
  const card = React.useRef<HTMLElement>(null);
  const result = React.useRef<HTMLParagraphElement>(null);

  async function submit() {
    if (inFlight.current || answered) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    // The answer may become a lasting rule for the agent; nothing hidden travels with it.
    const text = stripInvisible(answer).trim();
    try {
      const problem = await onAnswer(text, scope);
      setError(problem);
      if (problem === null) setAnswered({ text, scope });
    } catch {
      setError(l.error);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  // The form goes away once answered: the focus moves to what was sent instead of falling to the page.
  React.useEffect(() => {
    const active = document.activeElement;
    if (answered && (active === document.body || card.current?.contains(active))) result.current?.focus();
  }, [answered]);

  return (
    <article ref={card} data-slot="hand-raise" aria-busy={busy || undefined} className={cn("flex flex-col gap-3 rounded-md border border-hairline border-l-4 border-l-primary bg-surface p-4 shadow-elevation-1", className)}>
      <header className="text-callout">
        <strong>{agent}</strong> {l.raised}
      </header>
      <p className="whitespace-pre-wrap break-words text-callout">{stripInvisible(question)}</p>
      {tried ? (
        <p className="text-callout text-muted-foreground">
          {l.tried} {stripInvisible(tried)}
        </p>
      ) : null}
      {answered ? (
        <p ref={result} role="status" tabIndex={-1} className="rounded-xs text-callout font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {l.answered} ({answered.scope === "always" ? l.always : l.once})
          <span className="block font-normal whitespace-pre-wrap break-words text-muted-foreground">{answered.text}</span>
        </p>
      ) : (
        <>
          <Textarea aria-label={l.answer} placeholder={l.answerPlaceholder} maxLength={4000} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <RadioGroup aria-label={l.scope} value={scope} onValueChange={(v) => setScope(v as HandRaiseScope)} className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="once" id={`${id}-once`} />
              <Label htmlFor={`${id}-once`}>{l.once}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="always" id={`${id}-always`} aria-describedby={`${id}-hint`} />
              <Label htmlFor={`${id}-always`}>{l.always}</Label>
            </div>
          </RadioGroup>
          {scope === "always" ? (
            <p id={`${id}-hint`} className="text-footnote text-muted-foreground">
              {l.alwaysHint}
            </p>
          ) : null}
          <div>
            <Button pending={busy} disabled={!answer.trim()} onClick={submit}>
              {l.submit}
            </Button>
          </div>
        </>
      )}
      {error ? (
        <p role="alert" className="text-callout text-destructive">
          {error}
        </p>
      ) : null}
    </article>
  );
}

export { HandRaise };
