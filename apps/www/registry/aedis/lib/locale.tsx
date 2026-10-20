"use client";

import * as React from "react";

/** Every string an Aedis UI component shows. Apps never put their own copy here. */
export type Messages = {
  approvalCard: {
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
    error: string;
  };
  handRaise: {
    raised: string;
    tried: string;
    answer: string;
    answerPlaceholder: string;
    scope: string;
    once: string;
    always: string;
    alwaysHint: string;
    submit: string;
    error: string;
  };
  chat: {
    placeholder: string;
    send: string;
    message: string;
    log: string;
    sendError: string;
  };
  appShell: { menuLabel: string };
  /** Sidebar stays a Server Component, so it does not read the provider: pass `label={messages.sidebar.label}`. */
  sidebar: { label: string };
  localeSwitcher: { label: string };
  codeBlock: {
    copy: string;
    copied: string;
    copyFailed: string;
    hidden: string;
  };
  link: {
    external: string;
  };
  navigationMenu: {
    label: string;
  };
  sheet: {
    close: string;
  };
  dropdownMenu: {
    confirmTitle: string;
    confirmDescription: string;
    confirm: string;
    cancel: string;
  };
  spinner: {
    label: string;
  };
};

/** English, the default when there is no provider. */
export const en: Messages = {
  approvalCard: {
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
    error: "Something went wrong. Try again.",
  },
  handRaise: {
    raised: "raised a hand",
    tried: "Already tried:",
    answer: "Your answer",
    answerPlaceholder: "Your answer",
    scope: "Applies to",
    once: "Just this case",
    always: "Always",
    alwaysHint: "Becomes a lasting rule the agent follows in every conversation.",
    submit: "Answer",
    error: "Something went wrong. Try again.",
  },
  chat: {
    placeholder: "Write a message",
    send: "Send",
    message: "Message",
    log: "Conversation",
    sendError: "The message could not be sent. Try again.",
  },
  appShell: { menuLabel: "Menu" },
  sidebar: { label: "Main navigation" },
  localeSwitcher: { label: "Language" },
  codeBlock: {
    copy: "Copy code",
    copied: "Copied",
    copyFailed: "Could not copy. Select the code and copy it.",
    hidden: "Hidden character",
  },
  link: {
    external: "(external site)",
  },
  navigationMenu: {
    label: "Site navigation",
  },
  sheet: {
    close: "Close",
  },
  dropdownMenu: {
    confirmTitle: "Are you sure?",
    confirmDescription: "This cannot be undone.",
    confirm: "Continue",
    cancel: "Cancel",
  },
  spinner: {
    label: "Loading",
  },
};

type LocaleContextValue = { locale: string; messages: Messages };

const LocaleContext = React.createContext<LocaleContextValue>({ locale: "en", messages: en });

export type LocaleProviderProps = {
  /** BCP 47 tag the app already resolved, e.g. "pt-BR". Drives formatting too. */
  locale: string;
  /** Dictionary for that locale. Defaults to English. */
  messages?: Messages;
  children: React.ReactNode;
};

/** Active locale and dictionary for every Aedis UI component below it. */
function LocaleProvider({ locale, messages = en, children }: LocaleProviderProps) {
  const value = React.useMemo(() => ({ locale, messages }), [locale, messages]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** The active locale and dictionary; English without a provider. */
function useLocale() {
  return React.useContext(LocaleContext);
}

/** A component's strings from the dictionary, with the `labels` prop overriding single entries. */
function useMessages<K extends keyof Messages>(key: K, overrides?: Partial<Messages[K]>): Messages[K] {
  const { messages } = useLocale();
  return { ...messages[key], ...overrides };
}

export { LocaleProvider, useLocale, useMessages };
