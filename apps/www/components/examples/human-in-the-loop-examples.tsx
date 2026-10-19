"use client";

import { ApprovalCard } from "@/registry/aedis/ui/approval-card";
import { HandRaise } from "@/registry/aedis/ui/hand-raise";

const wait = () => new Promise<null>((r) => setTimeout(() => r(null), 500));

/** Docs example without a backend. */
export function ApprovalCardExample() {
  return (
    <ApprovalCard
      requester="Rafael"
      requestedAt="2 min ago"
      content={"**Proposal for Acme Bistro**: 4 shoot days a month.\n\n| Plan | Monthly |\n|---|---|\n| Recurring (6 mo) | $2,560 |\n| Annual | $2,240 |"}
      onApprove={wait}
      onRequestChanges={wait}
    />
  );
}

/** Docs example without a backend. */
export function HandRaiseExample() {
  return (
    <HandRaise
      agent="Otto"
      question="Can we prospect direct competitors of clients we already serve?"
      tried="Read the sales policy; asked Rafael."
      onAnswer={wait}
    />
  );
}
