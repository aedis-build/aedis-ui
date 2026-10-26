"use client";

import * as React from "react";

import { AgentConsole, type ConsoleTurn } from "@/registry/aedis/blocks/agent-console";

const start: ConsoleTurn[] = [
  { id: "1", role: "person", text: "Draft a proposal for Acme Bistro: 4 shoot days a month." },
  {
    id: "2",
    role: "agent",
    text: "Acme Bistro is on the **Pro** plan. A recurring plan for 6 months comes to **$2,560 a month**; annual is $2,240.",
    tools: [
      { id: "t1", name: "crm.lookup", status: "done", args: { client: "Acme Bistro", apiKey: "sk_live_51Hx" }, result: { plan: "Pro", since: "2025-03" } },
      { id: "t2", name: "pricing.quote", status: "done", args: { days: 4, term: "6 months" }, result: { monthly: 2560 } },
    ],
    sources: [
      { title: "Pricing policy 2026", url: "https://www.example.com/docs/pricing", snippet: "Shoot days are billed monthly, in advance." },
      { title: "Acme Bistro in the CRM", url: "/docs/approval-card" },
    ],
  },
];

/** Docs example without a backend: each send streams a short canned answer, and Stop aborts it. */
export default function AgentConsoleDemo() {
  const [turns, setTurns] = React.useState(start);
  return (
    <AgentConsole
      title="Sales agent"
      turns={turns}
      onSend={async (message, { signal }) => {
        const id = String(turns.length + 1);
        const answer =
          "Sent the draft to **Rafael** for approval before it goes to the client. Check where it stands with:\n\n```bash\ncurl -s https://api.example.com/v1/proposals/acme-bistro/status?include=approvals,history\n```";
        setTurns((t) => [...t, { id, role: "person", text: message.text }, { id: `${id}a`, role: "agent", text: "", streaming: true }]);
        for (let i = 1; i <= answer.length && !signal.aborted; i += 4) {
          await new Promise((r) => setTimeout(r, 40));
          setTurns((t) => t.map((x) => (x.id === `${id}a` ? { ...x, text: answer.slice(0, i) } : x)));
        }
        setTurns((t) => t.map((x) => (x.id === `${id}a` ? { ...x, text: signal.aborted ? x.text : answer, streaming: false } : x)));
      }}
    />
  );
}
