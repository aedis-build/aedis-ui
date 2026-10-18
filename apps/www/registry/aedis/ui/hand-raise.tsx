"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/registry/aedis/ui/button";
import { Label } from "@/registry/aedis/ui/label";
import { RadioGroup, RadioGroupItem } from "@/registry/aedis/ui/radio-group";
import { Textarea } from "@/registry/aedis/ui/textarea";

export type HandRaiseScope = "once" | "always";

export type HandRaiseLabels = {
  raised: string;
  tried: string;
  answer: string;
  answerPlaceholder: string;
  scope: string;
  once: string;
  always: string;
  alwaysHint: string;
  submit: string;
};

const defaultLabels: HandRaiseLabels = {
  raised: "raised a hand",
  tried: "Already tried:",
  answer: "Your answer",
  answerPlaceholder: "Your answer",
  scope: "Applies to",
  once: "Just this case",
  always: "Always",
  alwaysHint: "Becomes a lasting rule the agent follows in every conversation.",
  submit: "Answer",
};

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
  const l = { ...defaultLabels, ...labels };
  const id = React.useId();
  const [answer, setAnswer] = React.useState("");
  const [scope, setScope] = React.useState<HandRaiseScope>("once");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      setError(await onAnswer(answer.trim(), scope));
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article data-slot="hand-raise" className={cn("flex flex-col gap-3 rounded-xl border border-border border-l-4 border-l-primary bg-background p-4", className)}>
      <header className="text-sm">
        <strong>{agent}</strong> {l.raised}
      </header>
      <p className="whitespace-pre-wrap break-words text-sm">{question}</p>
      {tried ? (
        <p className="text-sm text-muted-foreground">
          {l.tried} {tried}
        </p>
      ) : null}
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
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {l.alwaysHint}
        </p>
      ) : null}
      <div>
        <Button disabled={busy || !answer.trim()} onClick={submit}>
          {l.submit}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </article>
  );
}

export { HandRaise };
