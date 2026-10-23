"use client";

import * as React from "react";

import { ApprovalCard } from "@/registry/aedis/ui/approval-card";
import { Badge } from "@/registry/aedis/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/registry/aedis/ui/empty";
import { HandRaise, type HandRaiseScope } from "@/registry/aedis/ui/hand-raise";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

export type PendingApproval = { id: string; requester: string; requestedAt: string; summary: string; content: string };
export type RaisedHand = { id: string; agent: string; question: string; tried?: string | null };

export type ApprovalInboxProps = {
  approvals: PendingApproval[];
  hands: RaisedHand[];
  onApprove: (id: string) => Promise<string | null>;
  onRequestChanges: (id: string, reason: string) => Promise<string | null>;
  onAnswer: (id: string, answer: string, scope: HandRaiseScope) => Promise<string | null>;
  className?: string;
};

const row =
  "focus-ring flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left text-callout transition-colors duration-(--duration-fast) ease-out hover:bg-muted aria-[current=true]:bg-accent-soft";

/** Everything waiting on a person: approvals before anything leaves the company, and questions agents could not answer. */
export function ApprovalInbox({ approvals, hands, onApprove, onRequestChanges, onAnswer, className }: ApprovalInboxProps) {
  const [selected, setSelected] = React.useState<string | null>(approvals[0]?.id ?? hands[0]?.id ?? null);
  const approval = approvals.find((a) => a.id === selected);
  const hand = hands.find((h) => h.id === selected);

  const list = <T extends { id: string }>(items: T[], line: (item: T) => [string, string]) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const [first, second] = line(item);
        return (
          <li key={item.id}>
            <button type="button" aria-current={item.id === selected} onClick={() => setSelected(item.id)} className={row}>
              <span className="font-medium">{first}</span>
              <span className="line-clamp-1 text-footnote text-muted-foreground">{second}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className={className ?? "grid w-full gap-6 md:grid-cols-[18rem_1fr]"}>
      <Tabs defaultValue="approvals">
        <TabsList aria-label="Waiting on you">
          <TabsTrigger value="approvals">Approvals <Badge variant="accent">{approvals.length}</Badge></TabsTrigger>
          <TabsTrigger value="hands">Raised hands <Badge variant="accent">{hands.length}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value="approvals">{list(approvals, (a) => [a.summary, `${a.requester} · ${a.requestedAt}`])}</TabsContent>
        <TabsContent value="hands">{list(hands, (h) => [h.agent, h.question])}</TabsContent>
      </Tabs>
      <div className="min-w-0">
        {approval ? (
          <ApprovalCard
            key={approval.id}
            requester={approval.requester}
            requestedAt={approval.requestedAt}
            content={approval.content}
            onApprove={() => onApprove(approval.id)}
            onRequestChanges={(reason) => onRequestChanges(approval.id, reason)}
          />
        ) : hand ? (
          <HandRaise key={hand.id} agent={hand.agent} question={hand.question} tried={hand.tried} onAnswer={(answer, scope) => onAnswer(hand.id, answer, scope)} />
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Nothing waiting</EmptyTitle>
              <EmptyDescription>Approvals and questions from agents show up here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}
