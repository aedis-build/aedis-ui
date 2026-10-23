import { Button } from "@/registry/aedis/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/registry/aedis/ui/dropdown-menu";

export default function AgentMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>Agent</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          Rename <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Publish (needs approval)</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Sales</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {/* safeUrl refuses this href, so the item renders disabled instead of running script. */}
        <DropdownMenuLinkItem href="javascript:alert(1)">Unsafe link</DropdownMenuLinkItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
