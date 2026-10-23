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
  siteHeader: {
    home: string;
    menu: string;
  };
  siteFooter: {
    label: string;
  };
  breadcrumb: {
    label: string;
    more: string;
  };
  pagination: {
    label: string;
    previous: string;
    next: string;
    goPrevious: string;
    goNext: string;
    more: string;
  };
  toast: {
    region: string;
    close: string;
    failed: string;
  };
  toolCall: {
    running: string;
    done: string;
    error: string;
    awaiting: string;
    arguments: string;
    result: string;
    external: string;
    wantsToRun: string;
    waiting: string;
  };
  chart: {
    /** Read after the chart's name, e.g. "Tokens this week, chart". */
    chart: string;
    /** Header of the table's first column when the chart gives none. */
    item: string;
    /** {count} is the number of values that were not drawn. */
    notShown: string;
  };
  reasoning: {
    thinking: string;
    thought: string;
    thoughtFor: string;
  };
  sources: {
    title: string;
    source: string;
  };
  promptInput: {
    placeholder: string;
    message: string;
    send: string;
    stop: string;
    attach: string;
    attachments: string;
    remove: string;
    uploading: string;
    typeNotAllowed: string;
    tooLarge: string;
    empty: string;
    tooMany: string;
    uploadFailed: string;
    sendError: string;
    model: string;
  };
  command: {
    label: string;
    placeholder: string;
    empty: string;
  };
  feedback: {
    label: string;
    positive: string;
    negative: string;
    comment: string;
    placeholder: string;
    send: string;
    skip: string;
    thanks: string;
    error: string;
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
  siteHeader: {
    home: "Home",
    menu: "Menu",
  },
  siteFooter: {
    label: "Footer",
  },
  breadcrumb: {
    label: "Breadcrumb",
    more: "More",
  },
  pagination: {
    label: "Pagination",
    previous: "Previous",
    next: "Next",
    goPrevious: "Go to previous page",
    goNext: "Go to next page",
    more: "More pages",
  },
  toast: {
    region: "Notifications",
    close: "Close notification",
    failed: "Something went wrong. Try again.",
  },
  toolCall: {
    running: "Running",
    done: "Done",
    error: "Failed",
    awaiting: "Waiting for approval",
    arguments: "Arguments",
    result: "Result",
    external: "acts outside",
    wantsToRun: "wants to run with these arguments.",
    waiting: "Waiting for a person to approve.",
  },
  chart: {
    chart: "chart",
    item: "Item",
    notShown: "{count} values not shown: not a number in range.",
  },
  reasoning: {
    thinking: "Thinking…",
    thought: "Reasoning",
    thoughtFor: "Thought for {seconds} s",
  },
  sources: {
    title: "Sources",
    source: "Source",
  },
  promptInput: {
    placeholder: "Ask the agent",
    message: "Message",
    send: "Send",
    stop: "Stop",
    attach: "Attach files",
    attachments: "Attachments",
    remove: "Remove {name}",
    uploading: "Uploading {name}",
    typeNotAllowed: "{name}: this type of file is not allowed.",
    tooLarge: "{name} is larger than {size}.",
    empty: "{name} is empty.",
    tooMany: "Attach at most {count} files.",
    uploadFailed: "{name} could not be uploaded. Try again.",
    sendError: "The message could not be sent. Try again.",
    model: "Model",
  },
  command: {
    label: "Search",
    placeholder: "Search…",
    empty: "No results.",
  },
  feedback: {
    label: "Rate this answer",
    positive: "Good answer",
    negative: "Bad answer",
    comment: "What went wrong? (optional)",
    placeholder: "It missed the client's budget.",
    send: "Send",
    skip: "Skip",
    thanks: "Thanks for the feedback.",
    error: "Feedback could not be sent. Try again.",
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
