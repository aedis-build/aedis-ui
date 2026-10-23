import { agentDocs, RULES } from "@/content/agent-docs";

export const dynamic = "force-static";

/** What the docs MCP server (`aedis mcp`) reads: every entry as text, plus the rules for agents. */
export function GET() {
  return Response.json({ version: 1, rules: RULES, items: agentDocs() });
}
