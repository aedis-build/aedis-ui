import { bffStream } from "@/registry/aedis/lib/bff-stream";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

/** The relay run on the server when this page was built, against a simulated API: who sees the token, who does not. */
async function relay(token: string | null) {
  let upstream = "";
  const GET = bffStream({
    upstream: "https://api.example.test/conversations/42/events",
    getAccessToken: () => token,
    log: () => {},
    fetcher: async (url, init) => {
      const h = new Headers(init?.headers);
      upstream = `GET ${url}\nAuthorization: ${h.get("authorization")}\nCookie: ${h.get("cookie") ?? "(none)"}`;
      return new Response('event: message\ndata: {"text":"Hello"}\n\n', { headers: { "content-type": "text/event-stream" } });
    },
  });
  const browser = new Request("https://app.example.test/api/conversations/42/events", { headers: { cookie: "session=abc123", authorization: "Bearer forged-by-the-page" } });
  const response = await GET(browser);
  return {
    upstream: upstream || "(no request: refused before reaching the API)",
    browser: `${response.status} ${response.headers.get("content-type") ?? ""}\n${(await response.text()).trim() || "(empty)"}`,
  };
}

export default async function BffStreamSimulator() {
  const cases = [
    { label: "Signed in", result: await relay("token-kept-on-the-server") },
    { label: "No session", result: await relay(null) },
  ];
  return (
    <Tabs defaultValue="Signed in" className="w-full max-w-xl">
      <TabsList aria-label="Session">
        {cases.map((c) => (
          <TabsTrigger key={c.label} value={c.label}>
            {c.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {cases.map((c) => (
        <TabsContent key={c.label} value={c.label} className="grid gap-3 pt-3 sm:grid-cols-2">
          {(
            [
              ["What the API received", c.result.upstream],
              ["What the browser received", c.result.browser],
            ] as const
          ).map(([title, text]) => (
            <div key={title} className="grid content-start gap-1">
              <p className="text-callout font-medium">{title}</p>
              <pre className="overflow-x-auto rounded-sm border border-hairline bg-surface p-3 font-mono text-footnote whitespace-pre-wrap">{text}</pre>
            </div>
          ))}
        </TabsContent>
      ))}
    </Tabs>
  );
}
