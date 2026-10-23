import { llmsTxt } from "@/content/agent-docs";

export const dynamic = "force-static";

/** The llmstxt.org index, built with the site from the same typed content as the pages. */
export function GET() {
  return new Response(llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
