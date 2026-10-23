import { Markdown } from "@/registry/aedis/ui/markdown";

export default function MarkdownDemo() {
  return (
    <Markdown className="text-sm">{"**Proposal** for *Acme*:\n\n- 4 days a month\n- [terms](https://example.com) · [bad](javascript:alert(1))\n\n<img src=x onerror=alert(1)> <b>raw html is dropped</b>"}</Markdown>
  );
}
