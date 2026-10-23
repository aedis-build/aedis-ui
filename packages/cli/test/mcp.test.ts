import { run, VERSION } from "../src/cli";
import { callTool, DOCS_URL, handle, loadDocs, type Docs } from "../src/mcp";
import { fakeFetch, io, project } from "./fixtures";

const item = (name: string, category: string, description: string) => ({
  name,
  title: name.replace(/-/g, " "),
  category,
  description,
  url: `https://ui.aedis.build/docs/${name}`,
  install: `npx @aedis/cli@${VERSION} add ${name}`,
  text: `## ${name}\n\nUsage and security of ${name}.`,
});
const docs: Docs = {
  rules: ["No prop takes markup."],
  items: [item("dropdown-menu", "Overlays", "A menu of actions."), item("approval-card", "AI and agents", "Waits for a human before anything leaves."), item("agent-console", "Blocks", "A conversation with an agent.")],
};
const json = () => Response.json(docs);
const call = (name: string, args: object) => JSON.stringify({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name, arguments: args } });

async function* lines(...messages: string[]) {
  yield* messages;
}

describe("loadDocs", () => {
  it("reads docs.json without following redirects and keeps only the known string fields", async () => {
    let init: RequestInit | undefined;
    const fetcher = (async (_: string, i?: RequestInit) => ((init = i), Response.json({ ...docs, items: [{ ...docs.items[0], extra: "<script>" }] }))) as unknown as typeof fetch;
    const loaded = await loadDocs(fetcher);
    expect(init?.redirect).toBe("error");
    expect(loaded.items[0]).toEqual(docs.items[0]);
  });

  it("refuses an error status, an oversized body and an unexpected shape", async () => {
    const answer = (r: () => Response) => fakeFetch({ [DOCS_URL]: r }).fetcher;
    await expect(loadDocs(answer(() => new Response("no", { status: 503 })))).rejects.toThrow("answered 503");
    await expect(loadDocs(answer(() => new Response("x".repeat(2_000_001))))).rejects.toThrow("too large");
    await expect(loadDocs(answer(() => Response.json({ rules: [], items: [{ name: 1 }] })))).rejects.toThrow("expected shape");
    await expect(loadDocs(answer(() => Response.json({ rules: "x", items: docs.items })))).rejects.toThrow("expected shape");
  });
});

describe("tools", () => {
  const out = (r: ReturnType<typeof callTool>) => r?.content[0].text ?? "";

  it("lists, filters by category, searches by every word, and says when nothing matches", () => {
    expect(out(callTool(docs, "list_components", {})).split("\n")).toHaveLength(3);
    expect(out(callTool(docs, "list_components", { category: "blocks" }))).toBe("agent-console: agent console (Blocks). A conversation with an agent.");
    expect(callTool(docs, "list_components", { category: "Nope" })?.isError).toBe(true);
    expect(out(callTool(docs, "search_components", { query: "human AGENTS" }))).toContain("approval-card");
    expect(out(callTool(docs, "search_components", { query: "  " }))).toBe("Nothing matches. Use list_components.");
  });

  it("returns one item in full with the rules, and its pinned install command", () => {
    expect(out(callTool(docs, "get_component", { name: "Dropdown-Menu " }))).toBe("## dropdown-menu\n\nUsage and security of dropdown-menu.\n\nRules for every Aedis UI item:\n- No prop takes markup.");
    expect(out(callTool(docs, "get_install_command", { name: "agent-console" }))).toMatch(new RegExp(`^npx @aedis/cli@${VERSION} add agent-console\\n\\nNew app\\? Run the init command once first \\(see https://ui.aedis.build/docs\\)\\.$`));
    expect(callTool(docs, "get_component", { name: 42 })).toMatchObject({ isError: true });
    expect(callTool(docs, "get_install_command", { name: "nope" })).toMatchObject({ isError: true });
    expect(callTool(docs, "nope", {})).toBeNull();
  });
});

describe("handle", () => {
  const load = async () => docs;

  it("negotiates the protocol version and describes the server", async () => {
    const init = (v: unknown) => handle(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: v } }), load, "9.9.9");
    expect(await init("2024-11-05")).toMatchObject({ id: 1, result: { protocolVersion: "2024-11-05", serverInfo: { name: "aedis-ui-docs", version: "9.9.9" }, capabilities: { tools: {} } } });
    expect(await init("1999-01-01")).toMatchObject({ result: { protocolVersion: "2025-06-18" } });
  });

  it("answers ping and tools/list, ignores notifications, and reports protocol errors", async () => {
    expect(await handle('{"jsonrpc":"2.0","id":2,"method":"ping"}', load, VERSION)).toEqual({ jsonrpc: "2.0", id: 2, result: {} });
    expect(await handle('{"jsonrpc":"2.0","id":3,"method":"tools/list"}', load, VERSION)).toMatchObject({ result: { tools: [{ name: "list_components" }, { name: "search_components" }, { name: "get_component" }, { name: "get_install_command" }] } });
    expect(await handle('{"jsonrpc":"2.0","method":"notifications/initialized"}', load, VERSION)).toBeNull();
    expect(await handle("{not json", load, VERSION)).toMatchObject({ error: { code: -32700 } });
    expect(await handle("null", load, VERSION)).toMatchObject({ error: { code: -32600 } });
    expect(await handle('{"jsonrpc":"2.0","id":4,"method":"resources/list"}', load, VERSION)).toMatchObject({ id: 4, error: { code: -32601 } });
    expect(await handle(call("write_file", {}), load, VERSION)).toMatchObject({ id: 7, error: { code: -32602 } });
  });

  it("calls a tool, and turns a docs failure into a tool error instead of crashing", async () => {
    expect(await handle(call("get_install_command", { name: "approval-card" }), load, VERSION)).toMatchObject({ id: 7, result: { content: [{ type: "text" }] } });
    expect(await handle(JSON.stringify({ jsonrpc: "2.0", id: 8, method: "tools/call", params: { name: "list_components" } }), load, VERSION)).toMatchObject({ result: { content: [{ type: "text" }] } });
    const failing = async (): Promise<Docs> => {
      throw new Error("offline");
    };
    expect(await handle(call("list_components", {}), failing, VERSION)).toMatchObject({ result: { isError: true, content: [{ text: "Could not load the docs: offline" }] } });
  });
});

describe("aedis mcp", () => {
  it("serves MCP on stdio, outside any project, loading docs.json once", async () => {
    const written: string[] = [];
    const t = io(project(), { [DOCS_URL]: json }, {
      stdin: () => lines('{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}', "", call("list_components", {}), call("get_component", { name: "approval-card" })),
      stdout: (s) => written.push(s),
    });
    expect(await run(["mcp"], { ...t.io, cwd: "/" })).toBe(0);
    const replies = written.map((w) => JSON.parse(w));
    expect(written.every((w) => w.endsWith("\n"))).toBe(true);
    expect(replies.map((r) => r.id)).toEqual([1, 7, 7]);
    expect(replies[2].result.content[0].text).toContain("approval-card");
    expect(t.calls.filter((c) => c === DOCS_URL)).toHaveLength(1);
    expect(t.lines).toEqual([]);
  });

  it("loads the docs again after a failure", async () => {
    let n = 0;
    const written: string[] = [];
    const t = io(project(), { [DOCS_URL]: () => (n++ === 0 ? new Response("down", { status: 502 }) : json()) }, {
      stdin: () => lines(call("list_components", {}), call("list_components", {})),
      stdout: (s) => written.push(s),
    });
    expect(await run(["mcp"], t.io)).toBe(0);
    expect(written.map((w) => JSON.parse(w).result.isError ?? false)).toEqual([true, false]);
  });

  it("needs stdin and stdout", async () => {
    const t = io(project(), {});
    expect(await run(["mcp"], t.io)).toBe(1);
    expect(t.lines).toEqual(["error: mcp: needs stdin and stdout"]);
  });
});
