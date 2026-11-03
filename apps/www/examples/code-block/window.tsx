import { CodeBlock } from "@/registry/aedis/ui/code-block";

const code = `import { securityHeaders } from "@/lib/security-headers";

export function middleware() {
  const headers = securityHeaders({ nonce: crypto.randomUUID() });
  return new Response(null, { headers });
}`;

export default function CodeBlockWindow() {
  return (
    <div className="grid w-full max-w-2xl gap-4">
      <CodeBlock lang="ts" title="middleware.ts" chrome="window" lineNumbers code={code} />
      <div className="grid gap-4 md:grid-cols-2">
        <CodeBlock lang="bash" lineNumbers code={"pnpm dlx @aedis/cli add code-block\npnpm dev"} />
        <CodeBlock lang="bash" title="terminal" chrome="window" code={"pnpm test"} />
      </div>
    </div>
  );
}
