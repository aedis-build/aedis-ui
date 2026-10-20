"use client";

import * as React from "react";

import { ACTIVITY_EVENT } from "@/registry/aedis/hooks/use-idle-timeout";
import { applyTheme, validateTheme, type CustomTheme, type ThemeMode } from "./custom-theme";
import { createBridge, type Bridge, type MessageSpec } from "./mf-bridge";

type ThemeMessage = { mode: ThemeMode; theme?: CustomTheme };
type LocaleMessage = { locale: string };
type Empty = Record<string, never>;

const isEmpty = (p: unknown): p is Empty => typeof p === "object" && p !== null && Object.keys(p).length === 0;
const isTheme = (p: unknown): p is ThemeMessage => {
  if (typeof p !== "object" || p === null) return false;
  const { mode, theme, ...rest } = p as Record<string, unknown>;
  return Object.keys(rest).length === 0 && (mode === "light" || mode === "dark") && (theme === undefined || validateTheme(theme).ok);
};

/** What the embedded app accepts from the host: theme and locale as validated data, and the end of the session. */
export function childMessages(locales: readonly string[]) {
  return {
    "context:theme": { validate: isTheme } as MessageSpec<ThemeMessage>,
    "context:locale": { validate: (p: unknown): p is LocaleMessage => typeof (p as LocaleMessage)?.locale === "string" && locales.includes((p as LocaleMessage).locale) } as MessageSpec<LocaleMessage>,
    "session:end": { validate: isEmpty } as MessageSpec<Empty>,
  };
}

/** What the host accepts from the embedded app: activity, so idle timeouts count it. */
export const hostMessages = { "session:activity": { validate: isEmpty } as MessageSpec<Empty> };

export type HostContext = { mode: ThemeMode; theme?: CustomTheme; locale: string };

/**
 * Host side, with the bridge to the embedded app (e.g. from MfFrame onBridge with messages={hostMessages}): sends the
 * theme and locale whenever they change, relays the child's activity to useIdleTimeout, and returns `endSession`,
 * to call on logout so the embedded app ends its session too.
 */
export function useMfContextHost(bridge: Bridge<typeof hostMessages> | null, context: HostContext) {
  const { mode, theme, locale } = context;
  const themeKey = theme ? JSON.stringify(theme) : "";
  React.useEffect(() => {
    if (!bridge) return;
    let live = true;
    void bridge.ready.then(() => {
      if (!live) return;
      bridge.send("context:theme", { mode, ...(themeKey ? { theme: JSON.parse(themeKey) } : {}) });
      bridge.send("context:locale", { locale });
    });
    return () => {
      live = false;
    };
  }, [bridge, mode, themeKey, locale]);

  React.useEffect(() => bridge?.on("session:activity", () => window.dispatchEvent(new Event(ACTIVITY_EVENT))), [bridge]);

  return React.useCallback(() => bridge?.send("session:end", {}), [bridge]);
}

export type MfContextOptions = {
  /** The host origins, from configuration. */
  hostOrigins: string[];
  /** Locales this app supports; anything else from the host is ignored. */
  locales: readonly string[];
  /** The host logged out (or went idle): sign out here too. */
  onSessionEnd: () => void;
  /** Report activity to the host at most this often. */
  activityEveryMs?: number;
};

/**
 * Embedded side: follows the host's theme (validated again, applied through the CSSOM) and locale (only known ones),
 * ends the session when the host does, and tells the host about activity so its idle timeout counts it.
 */
export function useMfContext({ hostOrigins, locales, onSessionEnd, activityEveryMs = 30_000 }: MfContextOptions) {
  const [locale, setLocale] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<ThemeMode | null>(null);
  const ended = React.useRef(onSessionEnd);
  ended.current = onSessionEnd;
  const originsKey = hostOrigins.join(" ");
  const localesKey = locales.join(" ");

  React.useEffect(() => {
    if (window.parent === window) return;
    const bridge = createBridge({ target: window.parent, origins: originsKey.split(" "), messages: childMessages(localesKey.split(" ")) });
    let undoTheme: (() => void) | undefined;
    const offTheme = bridge.on("context:theme", ({ mode: m, theme }) => {
      undoTheme?.();
      undoTheme = theme ? applyTheme(theme, { mode: m }) : undefined;
      document.documentElement.dataset.theme = m;
      setMode(m);
    });
    const offLocale = bridge.on("context:locale", ({ locale: l }) => setLocale(l));
    const offEnd = bridge.on("session:end", () => ended.current());

    let last = 0;
    const activity = () => {
      const now = Date.now();
      if (now - last < activityEveryMs) return;
      last = now;
      bridge.send("session:activity", {});
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    for (const e of events) window.addEventListener(e, activity, { passive: true });

    return () => {
      for (const e of events) window.removeEventListener(e, activity);
      offTheme();
      offLocale();
      offEnd();
      undoTheme?.();
      bridge.close();
    };
  }, [originsKey, localesKey, activityEveryMs]);

  return { locale, mode };
}
