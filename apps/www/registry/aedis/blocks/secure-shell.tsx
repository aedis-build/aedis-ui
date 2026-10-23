"use client";

import * as React from "react";

import { useIdleTimeout } from "@/registry/aedis/hooks/use-idle-timeout";
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
  /** Revoke the session on the server, then set session to "idle". */
  onIdle: () => void;
  /** Where signing in again starts, e.g. your sign-in route. */
  signInHref: string;
  className?: string;
};

const ended: Record<Exclude<SessionState, "active">, [string, string]> = {
  idle: ["Signed out for inactivity", "Nothing was left open on this screen. Sign in to carry on where you were."],
  expired: ["Your session ended", "It expired or was signed out on another device. Sign in again to continue."],
};

/**
 * The signed-in frame of an app: sidebar and content while the session is active, signed out after idle time, and a
 * clear state once the server ends the session. The content unmounts when the session ends, so nothing stays on screen.
 */
export function SecureShell({ title, sidebar, children, session, idleMinutes, onIdle, signInHref, className }: SecureShellProps) {
  useIdleTimeout(idleMinutes * 60_000, onIdle, session === "active");
  if (session !== "active") {
    const [heading, text] = ended[session];
    return (
      <Empty className={className}>
        <EmptyHeader>
          <EmptyTitle>{heading}</EmptyTitle>
          <EmptyDescription>{text}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<a href={signInHref} />}>Sign in</Button>
        </EmptyContent>
      </Empty>
    );
  }
  return (
    <AppShell title={title} sidebar={sidebar} className={className}>
      {children}
    </AppShell>
  );
}
