"use client";

import * as React from "react";

import { AppShell, AppShellAccountSwitcher } from "@/registry/aedis/ui/app-shell";
import { Avatar, AvatarFallback } from "@/registry/aedis/ui/avatar";
import { Badge } from "@/registry/aedis/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/registry/aedis/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/registry/aedis/ui/dropdown-menu";

const accounts = ["RLFN Tech", "Acme Studio"];
// The display stays out of the shared classes: a link hidden on phones sets its own, or "inline-flex" would beat "hidden".
const target = "focus-ring min-h-11 items-center rounded-xs px-2 text-callout hover:text-foreground";
const link = `${target} inline-flex`;

/** Account pages: no sidebar, an account bar, and an optional breadcrumb. The narrower page keeps the grid's left edge. */
export function AccountShell({ breadcrumb = false }: { breadcrumb?: boolean }) {
  const [account, setAccount] = React.useState(accounts[0]!);
  return (
    <div className="h-96 w-full overflow-auto rounded-xl border border-border">
      <AppShell
        // The docs page already has a <main>.
        main={false}
        className="min-h-full"
        start={
          <>
            <a href="#home" className={`${link} font-semibold`}>Aedis</a>
            <span aria-hidden="true" className="text-muted-foreground">/</span>
            <AppShellAccountSwitcher current={account}>
              <DropdownMenuRadioGroup value={account} onValueChange={setAccount}>
                {accounts.map((a) => (
                  <DropdownMenuRadioItem key={a} value={a} closeOnClick>{a}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </AppShellAccountSwitcher>
            <Badge variant="outline">Pro</Badge>
          </>
        }
        end={
          <>
            <a href="#docs" className={`${target} hidden text-muted-foreground md:inline-flex`}>Documentation</a>
            <DropdownMenu>
              <DropdownMenuTrigger className="press focus-ring inline-flex size-11 items-center justify-center rounded-full">
                <Avatar>
                  <AvatarFallback aria-hidden="true">JL</AvatarFallback>
                </Avatar>
                <span className="sr-only">Jordan Lee, profile</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLinkItem href="#settings">Settings</DropdownMenuLinkItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
        breadcrumb={
          breadcrumb ? (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="#account">{account}</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="#workspace">Production</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Plan and billing</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          ) : undefined
        }
      >
        {breadcrumb ? (
          <section className="md:col-span-8">
            <h3 className="text-headline">Plan and billing</h3>
            <p className="text-callout text-muted-foreground">{account} is on Pro. A narrower page takes the first eight columns.</p>
          </section>
        ) : (
          <section>
            <h3 className="text-headline">Workspaces</h3>
            <p className="text-callout text-muted-foreground">Every workspace of {account}.</p>
          </section>
        )}
      </AppShell>
    </div>
  );
}

export default function AppShellAccount() {
  return <AccountShell />;
}
