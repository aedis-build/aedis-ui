/**
 * `aedis mcp`: a read-only docs server for coding agents, over the Model Context Protocol on stdio (JSON-RPC 2.0, one
 * message per line). It answers from the site's docs.json: list and search components, read one with its API and
 * security rules, and get its install command. It writes nothing and runs nothing.
 */

export const DOCS_URL = "https://ui.aedis.build/docs.json";
/** docs.json is about 110 KB; anything far larger is not ours. */
const MAX_DOCS_BYTES = 2_000_000;
const PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"];

export type DocItem = { name: string; title: string; category: string; description: string; url: string; install: string; text: string };
export type Docs = { rules: string[]; items: DocItem[] };

type Request = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };

const FIELDS = ["name", "title", "category", "description", "url", "install", "text"] as const;

/** Fetches and checks docs.json: same host, no redirects, bounded size, every field a string. */
export async function loadDocs(fetcher: typeof fetch, url = DOCS_URL): Promise<Docs> {
  const response = await fetcher(url, { redirect: "error" });
  if (!response.ok) throw new Error(`docs: ${url} answered ${response.status}`);
  const body = await response.text();
  if (body.length > MAX_DOCS_BYTES) throw new Error("docs: docs.json is too large");
  const data = JSON.parse(body) as { rules?: unknown; items?: unknown };
  const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");
  const items = Array.isArray(data.items) ? data.items : [];
  if (!strings(data.rules) || !items.length || !items.every((i) => i && typeof i === "object" && FIELDS.every((f) => typeof (i as Record<string, unknown>)[f] === "string"))) {
    throw new Error("docs: docs.json does not have the expected shape");
  }
  return { rules: data.rules, items: items.map((i) => Object.fromEntries(FIELDS.map((f) => [f, (i as Record<string, string>)[f]])) as DocItem) };
}

const text = (t: string, isError = false) => ({ content: [{ type: "text", text: t }], ...(isError ? { isError: true } : {}) });
const line = (i: DocItem) => `${i.name}: ${i.title} (${i.category}). ${i.description}`;

const TOOLS = [
  {
    name: "list_components",
    description: "List every Aedis UI component, hook, library and block, optionally in one category (e.g. Forms, AI and agents, Blocks).",
    inputSchema: { type: "object", properties: { category: { type: "string" } } },
  },
  {
    name: "search_components",
    description: "Find Aedis UI items whose name, title, category or description contain every word of the query.",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "get_component",
    description: "One item in full: install command, usage, API by part, security (sinks, defenses, what stays on the backend) and the rules to follow.",
    inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
  },
  {
    name: "get_install_command",
    description: "The pinned @aedis/cli command that adds an item after verifying the signed release.",
    inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
  },
];

/** Answers one tool call from the docs. */
export function callTool(docs: Docs, name: string, args: Record<string, unknown>) {
  const arg = (k: string) => (typeof args[k] === "string" ? (args[k] as string).trim().slice(0, 200) : "");
  const find = () => docs.items.find((i) => i.name === arg("name").toLowerCase());
  const missing = () => text(`No item named "${arg("name")}". Use list_components or search_components.`, true);
  switch (name) {
    case "list_components": {
      const category = arg("category").toLowerCase();
      const items = docs.items.filter((i) => !category || i.category.toLowerCase() === category);
      return items.length ? text(items.map(line).join("\n")) : text(`No category "${arg("category")}".`, true);
    }
    case "search_components": {
      const words = arg("query").toLowerCase().split(/\s+/).filter(Boolean);
      const hits = docs.items.filter((i) => words.every((w) => `${i.name} ${i.title} ${i.category} ${i.description}`.toLowerCase().includes(w)));
      return text(words.length && hits.length ? hits.map(line).join("\n") : "Nothing matches. Use list_components.");
    }
    case "get_component": {
      const item = find();
      return item ? text(`${item.text}\n\nRules for every Aedis UI item:\n${docs.rules.map((r) => `- ${r}`).join("\n")}`) : missing();
    }
    case "get_install_command": {
      const item = find();
      return item ? text(`${item.install}\n\nNew app? Run the init command once first (see ${item.url.replace(/\/(docs|blocks)\/.*$/, "/docs")}).`) : missing();
    }
    default:
      return null;
  }
}

/** Handles one JSON-RPC message; returns the reply, or null for a notification. Docs load on the first tool call. */
export async function handle(message: string, docs: () => Promise<Docs>, version: string): Promise<object | null> {
  let req: Request;
  try {
    req = JSON.parse(message) as Request;
  } catch {
    return { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } };
  }
  if (req === null || typeof req !== "object" || typeof req.method !== "string") return { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid request" } };
  if (req.id === undefined) return null;
  const reply = (result: object) => ({ jsonrpc: "2.0", id: req.id, result });
  const params = req.params ?? {};
  switch (req.method) {
    case "initialize": {
      const asked = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      return reply({
        protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "aedis-ui-docs", version },
        instructions: "Read-only Aedis UI docs. Call get_component before using an item, follow its rules, and install it with get_install_command.",
      });
    }
    case "ping":
      return reply({});
    case "tools/list":
      return reply({ tools: TOOLS });
    case "tools/call": {
      const name = typeof params.name === "string" ? params.name : "";
      const args = params.arguments && typeof params.arguments === "object" ? (params.arguments as Record<string, unknown>) : {};
      if (!TOOLS.some((t) => t.name === name)) return { jsonrpc: "2.0", id: req.id, error: { code: -32602, message: `Unknown tool ${name}` } };
      try {
        return reply(callTool(await docs(), name, args)!);
      } catch (error) {
        return reply(text(`Could not load the docs: ${(error as Error).message}`, true));
      }
    }
    default:
      return { jsonrpc: "2.0", id: req.id, error: { code: -32601, message: `Method not found: ${req.method}` } };
  }
}

/** Serves MCP over newline-delimited JSON until the input ends. */
export async function serve(lines: AsyncIterable<string>, write: (line: string) => void, fetcher: typeof fetch, version: string) {
  let cache: Promise<Docs> | null = null;
  const docs = () => {
    cache ??= loadDocs(fetcher).catch((error) => {
      cache = null;
      throw error;
    });
    return cache;
  };
  for await (const message of lines) {
    if (!message.trim()) continue;
    const reply = await handle(message, docs, version);
    if (reply) write(`${JSON.stringify(reply)}\n`);
  }
}
