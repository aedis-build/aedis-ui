"use client";

import * as React from "react";

import { stripInvisible } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useFormat } from "@/registry/aedis/hooks/use-format";
import { checkAttachment, safeFileName, uploadAttachment, type AttachmentRules } from "@/registry/aedis/lib/attachment";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Button } from "@/registry/aedis/ui/button";
import { Progress } from "@/registry/aedis/ui/progress";
import { Textarea } from "@/registry/aedis/ui/textarea";

export type PromptInputLabels = Messages["promptInput"];

export type PromptMessage = {
  /** Trimmed, hidden characters removed. */
  text: string;
  /** Server ids of the uploaded attachments. */
  attachments: { id: string; name: string }[];
  model?: string;
};

export type PromptInputProps = {
  /**
   * Sends the message and streams the answer. Resolve when the answer is complete; while it runs the button is Stop,
   * which aborts `signal` (cancel the request and the server's work with it). Throw to keep the draft.
   */
  onSend: (message: PromptMessage, context: { signal: AbortSignal }) => Promise<void>;
  /** Match your server limit. */
  maxLength?: number;
  /** Turns attachments on: allow-list, size limit, same-origin upload path. */
  attachments?: AttachmentRules & { uploadPath: string; maxFiles?: number };
  /** Optional agent or model picker. */
  models?: { value: string; label: string }[];
  model?: string;
  onModelChange?: (value: string) => void;
  labels?: Partial<PromptInputLabels>;
  className?: string;
};

type Attachment = { key: number; name: string; status: "uploading" | "done" | "error"; progress: number; id?: string; abort: AbortController };

const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_m, k: string) => String(values[k] ?? ""));

/** The composer for an agent chat: bounded text, attachments with checks and progress, send that turns into stop. */
function PromptInput({ onSend, maxLength = 8000, attachments: rules, models, model, onModelChange, labels, className }: PromptInputProps) {
  const l = useMessages("promptInput", labels);
  const format = useFormat();
  const [text, setText] = React.useState("");
  const [files, setFiles] = React.useState<Attachment[]>([]);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<AbortController | null>(null);
  const counter = React.useRef(0);
  const picker = React.useRef<HTMLInputElement>(null);
  const textId = React.useId();

  // Uploads still running when the composer goes away are cancelled.
  const live = React.useRef(files);
  live.current = files;
  React.useEffect(() => () => live.current.forEach((f) => f.abort.abort()), []);

  const uploading = files.some((f) => f.status === "uploading");
  const ready = files.filter((f) => f.status === "done");
  const clean = stripInvisible(text).trim();
  const canSend = !pending && !uploading && (clean.length > 0 || ready.length > 0);

  const update = (key: number, patch: Partial<Attachment>) => setFiles((all) => all.map((f) => (f.key === key ? { ...f, ...patch } : f)));

  function attach(list: FileList | null) {
    if (!rules || !list) return;
    setProblem(null);
    const room = (rules.maxFiles ?? 10) - files.length;
    const chosen = [...list];
    if (chosen.length > room) setProblem(fill(l.tooMany, { count: rules.maxFiles ?? 10 }));
    for (const file of chosen.slice(0, Math.max(0, room))) {
      const name = safeFileName(file.name);
      const issue = checkAttachment(file, rules);
      if (issue) {
        setProblem(fill(issue === "size" ? l.tooLarge : issue === "empty" ? l.empty : l.typeNotAllowed, { name, size: format.number(rules.maxBytes / 1_000_000, { style: "unit", unit: "megabyte", maximumFractionDigits: 1 }) }));
        continue;
      }
      const entry: Attachment = { key: ++counter.current, name, status: "uploading", progress: 0, abort: new AbortController() };
      setFiles((all) => [...all, entry]);
      uploadAttachment(rules.uploadPath, file, { signal: entry.abort.signal, onProgress: (p) => update(entry.key, { progress: p }) }).then(
        ({ id }) => update(entry.key, { status: "done", progress: 1, id }),
        (error: unknown) => {
          if ((error as Error)?.name === "AbortError") return;
          update(entry.key, { status: "error" });
          setProblem(fill(l.uploadFailed, { name }));
        },
      );
    }
    if (picker.current) picker.current.value = "";
  }

  function remove(file: Attachment) {
    file.abort.abort();
    setFiles((all) => all.filter((f) => f.key !== file.key));
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSend) return;
    const controller = new AbortController();
    setPending(controller);
    setProblem(null);
    try {
      await onSend({ text: clean, attachments: ready.map((f) => ({ id: f.id!, name: f.name })), model }, { signal: controller.signal });
      setText("");
      setFiles([]);
    } catch (error) {
      if (!controller.signal.aborted) setProblem(l.sendError);
    } finally {
      setPending(null);
    }
  }

  return (
    <form data-slot="prompt-input" onSubmit={send} className={cn("flex flex-col gap-2 rounded-lg border border-border-control bg-surface p-2 shadow-elevation-1 focus-within:ring-2 focus-within:ring-ring", className)}>
      {files.length ? (
        <ul aria-label={l.attachments} className="flex flex-wrap gap-2 px-1 pt-1">
          {files.map((f) => (
            <li key={f.key} className="flex min-w-0 max-w-60 items-center gap-2 rounded-sm border border-hairline bg-muted px-2 py-1 text-footnote">
              <span className="min-w-0 flex-1 truncate" title={f.name}>{f.name}</span>
              {f.status === "uploading" ? <Progress value={Math.round(f.progress * 100)} aria-label={fill(l.uploading, { name: f.name })} className="h-1 w-12" /> : null}
              {f.status === "error" ? <span className="text-destructive">!</span> : null}
              <button type="button" onClick={() => remove(f)} aria-label={fill(l.remove, { name: f.name })} className="focus-ring rounded-xs text-muted-foreground hover:text-foreground">
                <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m4 4 8 8M12 4l-8 8" /></svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <label htmlFor={textId} className="sr-only">{l.message}</label>
      <Textarea
        id={textId}
        value={text}
        maxLength={maxLength}
        rows={2}
        placeholder={l.placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void send();
          }
        }}
        className="max-h-60 min-h-12 resize-none border-0 bg-transparent px-2 py-1.5 text-body shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center gap-2">
        {rules ? (
          <>
            <input ref={picker} type="file" multiple hidden accept={rules.accept.join(",")} onChange={(e) => attach(e.target.files)} data-slot="prompt-input-file" />
            <Button variant="ghost" size="icon" aria-label={l.attach} onClick={() => picker.current?.click()} disabled={Boolean(pending)} className="size-8">
              <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 7.5 8.2 12.3a3 3 0 0 1-4.3-4.3l5-5a2 2 0 0 1 2.9 2.9l-5 5a1 1 0 0 1-1.5-1.5l4.6-4.6" />
              </svg>
            </Button>
          </>
        ) : null}
        {models?.length ? (
          <select
            aria-label={l.model}
            value={model}
            onChange={(e) => onModelChange?.(e.target.value)}
            className="focus-ring h-8 rounded-sm border border-hairline bg-surface px-2 text-footnote"
          >
            {models.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        ) : null}
        <span className="ml-auto text-caption text-muted-foreground tabular-nums" aria-hidden="true">
          {text.length > maxLength * 0.9 ? `${text.length}/${maxLength}` : null}
        </span>
        {pending ? (
          <Button key="stop" type="button" size="icon" aria-label={l.stop} onClick={() => pending.abort()} className="size-8 rounded-full transition-[opacity,scale] duration-(--duration-fast) ease-out starting:scale-75 starting:opacity-0 motion-reduce:transition-none">
            <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><rect x="4.5" y="4.5" width="7" height="7" rx="1.5" /></svg>
          </Button>
        ) : (
          <Button key="send" type="submit" size="icon" aria-label={l.send} disabled={!canSend} className="size-8 rounded-full transition-[opacity,scale] duration-(--duration-fast) ease-out starting:scale-75 starting:opacity-0 motion-reduce:transition-none">
            <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" /></svg>
          </Button>
        )}
      </div>
      {problem ? <p role="alert" className="px-2 text-footnote text-destructive">{problem}</p> : null}
    </form>
  );
}

export { PromptInput };
