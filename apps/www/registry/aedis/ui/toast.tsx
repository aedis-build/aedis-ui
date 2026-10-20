"use client";

import * as React from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";

import { stripInvisible } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Button } from "@/registry/aedis/ui/button";

export type ToastLabels = Messages["toast"];
export type ToastType = "success" | "info" | "warning" | "error";

export type ToastOptions = {
  /** Plain text, never markup. */
  description?: string;
  /** Milliseconds before it closes on its own; 0 keeps it until dismissed. Paused while hovered or focused. */
  timeout?: number;
  action?: { label: string; onClick: () => void };
};

/** One manager per app; `<Toaster />` renders what it holds. */
export const toastManager = ToastPrimitive.createToastManager();

function show(type: ToastType | undefined, title: string, options: ToastOptions = {}) {
  return toastManager.add({
    type,
    title: stripInvisible(title),
    description: options.description === undefined ? undefined : stripInvisible(options.description),
    timeout: options.timeout,
    // Errors interrupt (an assertive live region, like role="alert"); everything else is announced politely.
    priority: type === "error" ? "high" : "low",
    actionProps: options.action ? { children: options.action.label, onClick: options.action.onClick } : undefined,
  });
}

/**
 * Feedback after an action: "Copied", "Saved", "Request failed". Text only. For failures write the message yourself,
 * or use `useToast().failed()` for the generic one: never show the server's error text.
 */
export const toast = {
  show: (title: string, options?: ToastOptions) => show(undefined, title, options),
  success: (title: string, options?: ToastOptions) => show("success", title, options),
  info: (title: string, options?: ToastOptions) => show("info", title, options),
  warning: (title: string, options?: ToastOptions) => show("warning", title, options),
  error: (title: string, options?: ToastOptions) => show("error", title, options),
  dismiss: (id: string) => toastManager.close(id),
};

/** `toast` plus `failed()`: the generic failure message in the reader's language, for catch blocks. */
export function useToast(labels?: Partial<ToastLabels>) {
  const l = useMessages("toast", labels);
  return React.useMemo(() => ({ ...toast, failed: (options?: ToastOptions) => show("error", l.failed, options) }), [l.failed]);
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <path d="M3.5 8.5l3 3 6-7" />,
  info: <path d="M8 7v4.5M8 4.5v.01" />,
  warning: <path d="M8 5v4M8 11.5v.01M7.1 2.6 1.6 12.1A1 1 0 0 0 2.5 13.6h11a1 1 0 0 0 .9-1.5L8.9 2.6a1 1 0 0 0-1.8 0Z" />,
  error: <path d="m5 5 6 6M11 5l-6 6" />,
};

const tone: Record<ToastType, string> = { success: "text-success", info: "text-link", warning: "text-warning", error: "text-destructive" };

function ToastList({ labels }: { labels?: Partial<ToastLabels> }) {
  const l = useMessages("toast", labels);
  const { toasts } = ToastPrimitive.useToastManager();
  return toasts.map((t) => {
    const type = t.type as ToastType | undefined;
    return (
      <ToastPrimitive.Root
        key={t.id}
        toast={t}
        data-slot="toast"
        className="toast material-thick pointer-events-auto rounded-lg border border-hairline text-foreground shadow-elevation-3 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ToastPrimitive.Content className="flex h-full items-start gap-3 overflow-hidden p-4 transition-opacity duration-(--duration-fast) ease-out data-behind:opacity-0 data-expanded:opacity-100">
          {type ? (
            <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", tone[type])} fill="none" stroke="currentColor" strokeWidth="1.5">
              {icons[type]}
            </svg>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <ToastPrimitive.Title data-slot="toast-title" className="text-callout font-semibold" />
            <ToastPrimitive.Description data-slot="toast-description" className="text-footnote text-muted-foreground" />
          </div>
          {t.actionProps ? <ToastPrimitive.Action data-slot="toast-action" render={<Button size="sm" variant="secondary" />} /> : null}
          <ToastPrimitive.Close data-slot="toast-close" aria-label={l.close} render={<Button variant="ghost" size="icon" className="-mt-1 -mr-1 size-7 text-muted-foreground" />}>
            <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="m4 4 8 8M12 4l-8 8" />
            </svg>
          </ToastPrimitive.Close>
        </ToastPrimitive.Content>
      </ToastPrimitive.Root>
    );
  });
}

type ToasterProps = Omit<ToastPrimitive.Provider.Props, "toastManager"> & { labels?: Partial<ToastLabels>; className?: string };

/** Place once near the root of the app. Toasts stack in the bottom corner and can be swiped away. */
function Toaster({ children, labels, className, limit = 3, ...props }: ToasterProps) {
  const l = useMessages("toast", labels);
  return (
    <ToastPrimitive.Provider toastManager={toastManager} limit={limit} {...props}>
      {children}
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport
          data-slot="toast-viewport"
          aria-label={l.region}
          className={cn("pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full", className)}
        >
          <ToastList labels={labels} />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}

export { Toaster };
