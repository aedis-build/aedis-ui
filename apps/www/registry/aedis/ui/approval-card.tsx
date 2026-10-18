"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
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

export type ApprovalCardLabels = {
  requests: string;
  approve: string;
  requestChanges: string;
  confirmTitle: string;
  confirmDescription: string;
  confirm: string;
  cancel: string;
  reason: string;
  reasonPlaceholder: string;
  sendRequest: string;
  back: string;
};

const defaultLabels: ApprovalCardLabels = {
  requests: "requests approval",
  approve: "Approve",
  requestChanges: "Request changes",
  confirmTitle: "Approve and send?",
  confirmDescription: "The agent will carry on and send it right away.",
  confirm: "Approve",
  cancel: "Cancel",
  reason: "What should change",
  reasonPlaceholder: "What should change?",
  sendRequest: "Request changes",
  back: "Back",
};

export type ApprovalCardProps = {
  /** Who asks, e.g. the agent's name. */
  requester: string;
  /** What is being approved, as untrusted markdown. */
  content: string;
  /** When it was requested, already formatted. */
  requestedAt?: string;
  /** Approve. Resolve with an error message to show it, or null on success. */
  onApprove: () => Promise<string | null>;
  /** Request changes with a required reason. Resolve with an error message or null. */
  onRequestChanges: (reason: string) => Promise<string | null>;
  labels?: Partial<ApprovalCardLabels>;
  className?: string;
};

/** A request from an agent that waits for a human. Approving always goes through a confirmation. */
function ApprovalCard({ requester, content, requestedAt, onApprove, onRequestChanges, labels, className }: ApprovalCardProps) {
  const l = { ...defaultLabels, ...labels };
  const [mode, setMode] = React.useState<"idle" | "changes">("idle");
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function run(action: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    try {
      setError(await action());
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article data-slot="approval-card" className={cn("flex flex-col gap-3 rounded-xl border border-border border-l-4 border-l-accent bg-background p-4", className)}>
      <header className="text-sm">
        <strong>{requester}</strong> {l.requests}
        {requestedAt ? <span className="ml-2 text-muted-foreground">{requestedAt}</span> : null}
      </header>
      <Markdown className="text-sm">{content}</Markdown>
      {mode === "idle" ? (
        <div className="flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={busy}>{l.approve}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{l.confirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{l.confirmDescription}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{l.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={() => run(onApprove)}>{l.confirm}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" disabled={busy} onClick={() => setMode("changes")}>
            {l.requestChanges}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Textarea aria-label={l.reason} placeholder={l.reasonPlaceholder} maxLength={4000} value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy || !reason.trim()} onClick={() => run(() => onRequestChanges(reason.trim()))}>
              {l.sendRequest}
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => setMode("idle")}>
              {l.back}
            </Button>
          </div>
        </div>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </article>
  );
}

export { ApprovalCard };
