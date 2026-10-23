import { llmsFullTxt } from "@/content/agent-docs";

export const dynamic = "force-static";

/** Every entry in full for coding agents: install command, usage, API, security and rules. */
export function GET() {
  return new Response(llmsFullTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
