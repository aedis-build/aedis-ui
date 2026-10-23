"use client";

import { ApprovalCard } from "@/registry/aedis/ui/approval-card";

const wait = () => new Promise<null>((r) => setTimeout(() => r(null), 500));

/** Docs example without a backend. */
export default function ApprovalCardDemo() {
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
