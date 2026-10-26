"use client";

import * as React from "react";

import { useIdleTimeout } from "@/registry/aedis/hooks/use-idle-timeout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/registry/aedis/ui/alert-dialog";
import { AppShell } from "@/registry/aedis/ui/app-shell";
import { Button } from "@/registry/aedis/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/registry/aedis/ui/empty";

export type SessionState = "active" | "idle" | "expired";

export type SecureShellProps = {
  title: string;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  /** From the server: "expired" when the session cookie is gone or revoked. */
  session: SessionState;
  /** Minutes without activity before the shell signs out. */
  idleMinutes: number;
  /** Seconds before that to warn and offer to stay signed in (WCAG 2.2.1). 0 turns the warning off. */
  warnSeconds?: number;
  /** Revoke the session on the server, then set session to "idle". */
  onIdle: () => void;
  /** Where signing in again starts, e.g. your sign-in route. */
  signInHref: string;
  /** The content is the page's <main>; pass false inside a page that already has one. */
  main?: boolean;
  className?: string;
};

const ended: Record<Exclude<SessionState, "active">, [string, string]> = {
  idle: ["Signed out for inactivity", "Nothing was left open on this screen. Sign in to carry on where you were."],
  expired: ["Your session ended", "It expired or was signed out on another device. Sign in again to continue."],
};

/**
 * The signed-in frame of an app: sidebar and content while the session is active, a warning before signing out for
 * inactivity, and a clear, announced state once the session ends. The content unmounts when the session ends, so
 * nothing stays on screen, and the focus moves to "Sign in" instead of falling to the page.
 */
export function SecureShell({ title, sidebar, children, session, idleMinutes, warnSeconds = 60, onIdle, signInHref, main, className }: SecureShellProps) {
  const active = session === "active";
  const { warning, stay } = useIdleTimeout(idleMinutes * 60_000, onIdle, active, warnSeconds * 1000);
  const signIn = React.useRef<HTMLAnchorElement>(null);
  const wasActive = React.useRef(active);

  React.useEffect(() => {
    if (wasActive.current && !active) signIn.current?.focus();
    wasActive.current = active;
  }, [active]);

  if (!active) {
    const [heading, text] = ended[session];
    return (
      <Empty className={className}>
        {/* An alert: the person may be looking elsewhere when it happens. */}
        <EmptyHeader role="alert">
          <EmptyTitle>{heading}</EmptyTitle>
          <EmptyDescription>{text}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<a ref={signIn} href={signInHref} />}>Sign in</Button>
        </EmptyContent>
      </Empty>
    );
  }
  const minutes = Math.max(1, Math.round(warnSeconds / 60));
  return (
    <AppShell title={title} sidebar={sidebar} main={main} className={className}>
      {children}
      {/* Starts on "Stay signed in"; Escape, a press anywhere or the button keeps the session. */}
      <AlertDialog open={warning} onOpenChange={(open) => !open && stay()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Still there?</AlertDialogTitle>
            <AlertDialogDescription>
              {warnSeconds < 60 ? `You will be signed out in ${warnSeconds} seconds` : `You will be signed out in ${minutes} minute${minutes > 1 ? "s" : ""}`} for inactivity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onIdle}>Sign out now</AlertDialogAction>
            <AlertDialogCancel>Stay signed in</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
