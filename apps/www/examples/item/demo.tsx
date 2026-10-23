import { Button } from "@/registry/aedis/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/registry/aedis/ui/item";

export default function ItemDemo() {
  return (
    <ItemGroup aria-label="Agents" className="max-w-md">
      <Item variant="outline">
        <ItemContent>
          <ItemTitle>Avalo</ItemTitle>
          <ItemDescription>Answers leads on WhatsApp.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="secondary">Pause</Button>
        </ItemActions>
      </Item>
      <Item variant="outline" href="/docs/approval-card">
        <ItemContent>
          <ItemTitle>Talbot</ItemTitle>
          <ItemDescription>3 approvals waiting.</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}
