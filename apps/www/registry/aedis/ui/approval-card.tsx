"use client";

import * as React from "react";

import { stripInvisible } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/aedis/ui/alert-dialog";
import { Button } from "@/registry/aedis/ui/button";
import { Markdown } from "@/registry/aedis/ui/markdown";
import { Textarea } from "@/registry/aedis/ui/textarea";

export type ApprovalCardLabels = Messages["approvalCard"];

export type ApprovalCardProps = {
  /** Who asks, e.g. the agent's name. */
  requester: string;
  /** What is being approved, as untrusted markdown. */
  content: string;
  /** When it was requested, already formatted. */
  requestedAt?: string;
  /** Approve. Called at most once at a time. Resolve with an error message to show it, or null on success. */
  onApprove: () => Promise<string | null>;
  /** Request changes with a required reason. Resolve with an error message or null. */
  onRequestChanges: (reason: string) => Promise<string | null>;
  labels?: Partial<ApprovalCardLabels>;
  className?: string;
};

type Outcome = { kind: "approved" } | { kind: "changes"; reason: string };

/**
 * A request from an agent that waits for a human. Approving always goes through a confirmation, runs once however
 * often it is pressed, and the card then shows what was decided instead of its actions.
 */
function ApprovalCard({ requester, content, requestedAt, onApprove, onRequestChanges, labels, className }: ApprovalCardProps) {
  const l = useMessages("approvalCard", labels);
  const [mode, setMode] = React.useState<"idle" | "changes">("idle");
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [outcome, setOutcome] = React.useState<Outcome | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  // A ref, not state: a second click in the same frame (or during the dialog's exit) sees it at once.
  const inFlight = React.useRef(false);
  const card = React.useRef<HTMLElement>(null);
  const result = React.useRef<HTMLParagraphElement>(null);
  const reasonBox = React.useRef<HTMLTextAreaElement>(null);
  const changesButton = React.useRef<HTMLButtonElement>(null);
  const modeChanged = React.useRef(false);

  async function run(action: () => Promise<string | null>, done: Outcome) {
    if (inFlight.current || outcome) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const problem = await action();
      setError(problem);
      if (problem === null) setOutcome(done);
    } catch {
      setError(l.error);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  // Each step puts the focus where the next action is, never on the page: the reason field, back on the button
  // that opened it, or the outcome once the actions are gone.
  React.useEffect(() => {
    if (!modeChanged.current) return;
    (mode === "changes" ? reasonBox : changesButton).current?.focus();
  }, [mode]);
  React.useEffect(() => {
    const active = document.activeElement;
    if (outcome && (active === document.body || card.current?.contains(active))) result.current?.focus();
  }, [outcome]);

  const switchMode = (next: "idle" | "changes") => {
    modeChanged.current = true;
    setMode(next);
  };

  return (
    <article ref={card} data-slot="approval-card" data-outcome={outcome?.kind} aria-busy={busy || undefined} className={cn("flex flex-col gap-3 rounded-md border border-hairline border-l-4 border-l-accent bg-surface p-4 shadow-elevation-1 data-[outcome=approved]:border-l-success", className)}>
      <header className="text-callout">
        <strong>{requester}</strong> {l.requests}
        {requestedAt ? <span className="ml-2 text-muted-foreground">{requestedAt}</span> : null}
      </header>
      <Markdown className="text-callout">{content}</Markdown>
      {outcome ? (
        <p ref={result} role="status" tabIndex={-1} className="rounded-xs text-callout font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {outcome.kind === "approved" ? l.approved : l.changesRequested}
          {outcome.kind === "changes" ? <span className="block font-normal whitespace-pre-wrap break-words text-muted-foreground">{outcome.reason}</span> : null}
        </p>
      ) : mode === "idle" ? (
        <div className="flex flex-wrap gap-2">
          {/* While an approval runs the dialog stays shut, so a third press cannot confirm it again. */}
          <AlertDialog open={confirming} onOpenChange={(open) => setConfirming(open && !inFlight.current)}>
            <AlertDialogTrigger render={<Button pending={busy} />}>{l.approve}</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{l.confirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{l.confirmDescription}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{l.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={() => run(onApprove, { kind: "approved" })}>{l.confirm}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button ref={changesButton} variant="outline" pending={busy} onClick={() => switchMode("changes")}>
            {l.requestChanges}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Textarea ref={reasonBox} aria-label={l.reason} placeholder={l.reasonPlaceholder} maxLength={4000} value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button
              pending={busy}
              disabled={!reason.trim()}
              onClick={() => {
                const clean = stripInvisible(reason).trim();
                void run(() => onRequestChanges(clean), { kind: "changes", reason: clean });
              }}
            >
              {l.sendRequest}
            </Button>
            <Button variant="outline" pending={busy} onClick={() => switchMode("idle")}>
              {l.back}
            </Button>
          </div>
        </div>
      )}
      {error ? (
        <p role="alert" className="text-callout text-destructive">
          {error}
        </p>
      ) : null}
    </article>
  );
}

export { ApprovalCard };
