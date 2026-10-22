import { Button } from "@/registry/aedis/ui/button";

export default function ButtonAsLink() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button render={<a href="/docs" />}>Get started</Button>
      <Button variant="link" render={<a href="/docs/theming" />}>Theming</Button>
    </div>
  );
}
