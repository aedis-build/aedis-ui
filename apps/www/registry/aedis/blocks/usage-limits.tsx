"use client";

import * as React from "react";

import { useFormat } from "@/registry/aedis/hooks/use-format";
import { Alert, AlertDescription, AlertTitle } from "@/registry/aedis/ui/alert";
import { Badge } from "@/registry/aedis/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/aedis/ui/card";
import { Progress } from "@/registry/aedis/ui/progress";

export type AgentUsage = { id: string; name: string; spent: number; ceiling: number };

export type UsageLimitsProps = {
  agents: AgentUsage[];
  /** ISO 4217 code, e.g. "USD". */
  currency: string;
  /** e.g. "Today" or "October". */
  period: string;
  /** Share of the ceiling that raises a warning, from 0 to 1. */
  warnAt?: number;
  className?: string;
};

/** Spend per agent against its ceiling, with a warning near the limit and an error once an agent is paused. */
export function UsageLimits({ agents, currency, period, warnAt = 0.8, className }: UsageLimitsProps) {
  const f = useFormat();
  // A ceiling of zero or less pauses the agent: never divide by it.
  const share = (a: AgentUsage) => (a.ceiling > 0 ? a.spent / a.ceiling : 1);
  const paused = agents.filter((a) => share(a) >= 1);
  const near = agents.filter((a) => share(a) >= warnAt && share(a) < 1);

  return (
    <div className={className ?? "w-full space-y-4"}>
      {paused.length ? (
        <Alert variant="destructive">
          <AlertTitle>Paused at the ceiling: {paused.map((a) => a.name).join(", ")}</AlertTitle>
          <AlertDescription>They do no more work this period until someone raises the ceiling.</AlertDescription>
        </Alert>
      ) : null}
      {near.length ? (
        <Alert variant="warning">
          <AlertTitle>Near the ceiling: {near.map((a) => a.name).join(", ")}</AlertTitle>
          <AlertDescription>Above {f.number(warnAt, { style: "percent" })} of their ceiling.</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {agents.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                {a.name}
                {share(a) >= 1 ? <Badge variant="destructive">Paused</Badge> : share(a) >= warnAt ? <Badge variant="outline">Near limit</Badge> : null}
              </CardTitle>
              <CardDescription>
                {period}: {f.currency(a.spent, currency)} of {f.currency(a.ceiling, currency)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* The bar says the state too, not only the badge: amber near the limit, red once paused. */}
              <Progress
                value={Math.round(share(a) * 100)}
                aria-label={`${a.name}: share of the ceiling used`}
                className={share(a) >= 1 ? "[&_[data-slot=progress-indicator]]:bg-destructive-solid" : share(a) >= warnAt ? "[&_[data-slot=progress-indicator]]:bg-warning" : undefined}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
