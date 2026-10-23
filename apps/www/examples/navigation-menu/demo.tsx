import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/registry/aedis/ui/navigation-menu";

export default function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent className="grid w-72 gap-1">
            <NavigationMenuLink href="/docs/approval-card">
              <span className="block font-medium">Approval Card</span>
              <span className="block text-footnote text-muted-foreground">Agent requests that wait for a person.</span>
            </NavigationMenuLink>
            <NavigationMenuLink href="/docs/chat">
              <span className="block font-medium">Chat</span>
              <span className="block text-footnote text-muted-foreground">Conversation with an agent, output as data.</span>
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem active>
          <NavigationMenuLink href="/docs/navigation-menu" active>Docs</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="https://github.com/aedis-build/aedis-ui">GitHub</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
