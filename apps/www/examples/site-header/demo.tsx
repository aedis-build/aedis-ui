import { Button } from "@/registry/aedis/ui/button";
import { SiteHeader } from "@/registry/aedis/ui/site-header";

export default function SiteHeaderDemo() {
  return (
    <SiteHeader
      className="static"
      brand="Aedis"
      items={[
        { label: "Docs", href: "/docs/site-header", active: true },
        { label: "Components", href: "/docs/button" },
      ]}
      actions={
        <Button size="sm" render={<a href="https://github.com/aedis-build/aedis-ui" rel="noopener noreferrer" />}>
          GitHub
        </Button>
      }
    />
  );
}
