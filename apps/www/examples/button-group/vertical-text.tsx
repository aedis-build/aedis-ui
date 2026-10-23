import { Button } from "@/registry/aedis/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/registry/aedis/ui/button-group";
import { Input } from "@/registry/aedis/ui/input";

export default function ButtonGroupVerticalText() {
  return (
    <div className="flex flex-wrap items-start gap-6">
      <ButtonGroup orientation="vertical" aria-label="Zoom">
        <Button variant="outline">Zoom in</Button>
        <Button variant="outline">Zoom out</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Webhook URL">
        <ButtonGroupText>https://</ButtonGroupText>
        <Input aria-label="Host" placeholder="hooks.example.com" />
      </ButtonGroup>
    </div>
  );
}
