import { CodeBlock } from "@/registry/aedis/ui/code-block";

export default function CodeBlockDemo() {
  return (
    <div className="space-y-4">
      <CodeBlock title="app/page.tsx" lang="tsx" code={'import { Button } from "@/registry/aedis/ui/button";\n\nexport default function Page() {\n  return <Button>Approve</Button>;\n}'} />
      <CodeBlock animated lang="bash" code={"npx @aedis/cli@0.4.2 add approval-card\npnpm dev"} />
    </div>
  );
}
