import { SiteFooter } from "@/registry/aedis/ui/site-footer";

export default function SiteFooterDemo() {
  return (
    <SiteFooter
      links={[
        { label: "Docs", href: "/docs/site-footer" },
        { label: "GitHub", href: "https://github.com/aedis-build/aedis-ui" },
      ]}
    >
      MIT licensed.
    </SiteFooter>
  );
}
