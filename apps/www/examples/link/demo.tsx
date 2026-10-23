import { Link } from "@/registry/aedis/ui/link";

export default function LinkDemo() {
  return (
    <p className="text-callout">
      Read the <Link href="/docs/theming">theming guide</Link>, the <Link href="https://github.com/aedis-build/aedis-ui">source</Link> or a <Link href="javascript:alert(1)">refused link</Link>.
    </p>
  );
}
