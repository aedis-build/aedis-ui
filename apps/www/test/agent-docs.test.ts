import { agentDocs, llmsFullTxt, llmsTxt, RULES, SITE } from "@/content/agent-docs";
import { blocks } from "@/content/blocks";
import { components } from "@/content/components";

describe("docs for agents", () => {
  const docs = agentDocs();

  it("cover every component, hook, library and block once, with a pinned install command", () => {
    expect(docs.map((d) => d.name).sort()).toEqual([...components.map((c) => c.name), ...blocks.map((b) => b.name)].sort());
    for (const d of docs) expect(d.install.replace(/@\d+\.\d+\.\d+ /, "@X ")).toBe(`npx @aedis/cli@X add ${d.name}`);
  });

  it("give each entry its API, security and the rules for the sinks it touches", () => {
    const menu = docs.find((d) => d.name === "dropdown-menu")!.text;
    expect(menu).toContain("### DropdownMenuItem");
    expect(menu).toContain("Security: sinks DOM.");
    expect(menu).toContain(`- ${RULES[1]}`);
    expect(menu).toContain(`- ${RULES[4]}`);
    const input = docs.find((d) => d.name === "input")!.text;
    expect(input).toContain(`- ${RULES[2]}`);
    expect(docs.find((d) => d.name === "api")!.text).toContain(`- ${RULES[3]}`);
    expect(docs.find((d) => d.name === "badge")!.text).toContain("Security: sinks none.");
  });

  it("index everything in llms.txt and put it all in llms-full.txt", () => {
    const index = llmsTxt();
    for (const d of docs) expect(index).toContain(`(${d.url})`);
    expect(index).toContain(`${SITE}/llms-full.txt`);
    expect(llmsFullTxt()).toContain(docs.at(-1)!.text);
  });
});
