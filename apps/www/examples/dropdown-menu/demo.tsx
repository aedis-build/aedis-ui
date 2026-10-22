import { Button } from "@/registry/aedis/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/aedis/ui/dropdown-menu";

export default function SessionActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>Session actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Session</DropdownMenuLabel>
        <DropdownMenuItem>Renew token</DropdownMenuItem>
        <DropdownMenuLinkItem href="/docs/approval-card">See devices</DropdownMenuLinkItem>
        <DropdownMenuLinkItem href="https://github.com/aedis-build/aedis-ui">Source</DropdownMenuLinkItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" confirm={{ title: "Revoke every session?", description: "Every device signs out right away." }}>
          Revoke all sessions…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
