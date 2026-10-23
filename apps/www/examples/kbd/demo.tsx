import { Kbd, KbdGroup } from "@/registry/aedis/ui/kbd";

export default function KbdDemo() {
  return (
    <p className="text-callout">
      Search with{" "}
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </p>
  );
}
