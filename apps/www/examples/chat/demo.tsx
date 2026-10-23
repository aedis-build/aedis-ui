"use client";

import * as React from "react";

import { Chat, type ChatMessage } from "@/registry/aedis/ui/chat";

const initial: ChatMessage[] = [
  { id: 1, author: "Jordan", role: "person", content: "Can you put together a proposal for 4 shoot days a month?" },
  {
    id: 2,
    author: "Rafael",
    role: "agent",
    content: "Here are the two options:\n\n| Item | Recurring (6 mo) | Annual |\n|---|---|---|\n| Day rate | $640 | $560 |\n| Monthly | $2,560 | $2,240 |\n\n[Pricing policy](https://example.com/pricing) · [unsafe link](javascript:alert(1))",
  },
];

/** Docs example: replies after a short delay, without a backend. */
export default function ChatDemo() {
  const [messages, setMessages] = React.useState(initial);
  const [working, setWorking] = React.useState(false);

  return (
    <div className="flex h-96 flex-col">
      <Chat
        messages={messages}
        working={working ? "Rafael is working on it…" : undefined}
        onSend={async (text) => {
          setMessages((m) => [...m, { id: m.length + 1, author: "Jordan", role: "person", content: text }]);
          setWorking(true);
          await new Promise((r) => setTimeout(r, 800));
          setWorking(false);
          setMessages((m) => [...m, { id: m.length + 1, author: "Rafael", role: "agent", content: "Got it. I will ask for approval before sending anything." }]);
        }}
      />
    </div>
  );
}
