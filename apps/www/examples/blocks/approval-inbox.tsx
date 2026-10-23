"use client";

import { ApprovalInbox } from "@/registry/aedis/blocks/approval-inbox";

const wait = () => new Promise<null>((r) => setTimeout(() => r(null), 500));

/** Docs example without a backend. */
export default function ApprovalInboxDemo() {
  return (
    <ApprovalInbox
      approvals={[
        {
          id: "a1",
          requester: "Rafael",
          requestedAt: "2 min ago",
          summary: "Proposal for Acme Bistro",
          content: "**Proposal for Acme Bistro**: 4 shoot days a month.\n\n| Plan | Monthly |\n|---|---|\n| Recurring (6 mo) | $2,560 |\n| Annual | $2,240 |",
        },
        { id: "a2", requester: "Otto", requestedAt: "1 h ago", summary: "Refund for Casa Verde", content: "Refund **$120** for the cancelled shoot on 14 October." },
      ]}
      hands={[{ id: "h1", agent: "Otto", question: "Can we prospect direct competitors of clients we already serve?", tried: "Read the sales policy; asked Rafael." }]}
      onApprove={wait}
      onRequestChanges={wait}
      onAnswer={wait}
    />
  );
}
