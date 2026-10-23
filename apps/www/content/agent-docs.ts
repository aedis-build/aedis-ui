import { CLI } from "@/components/site/install-command";
import { blocks } from "@/content/blocks";
import { apiParts, components, guides, type ComponentDoc, type Sink } from "@/content/components";

/** Where the site is served (wrangler.jsonc, deploy.yml). */
export const SITE = "https://ui.aedis.build";

/** What a coding agent must follow with every item; repeated per entry for the sinks it touches. */
export const RULES = [
  `Install with \`npx ${CLI} add <name>\` (it verifies the signed release). Never run \`npx aedis\`: that package belongs to someone else.`,
  "Pass agent and user content as props or text children. No prop takes markup; never use dangerouslySetInnerHTML.",
  "Keep text fields bounded: leave the default maxLength or set it to the server's limit, never remove it.",
  "Reach the backend through api() (same-origin, CSRF header, no redirects); never fetch another origin with credentials.",
  "Actions that delete or leave the company go through a confirmation that starts on Cancel: AlertDialog, ApprovalCard or a destructive DropdownMenuItem.",
];

const sinkRule: Record<Sink, string> = {
  DOM: RULES[1],
  Input: RULES[2],
  Transport: RULES[3],
  Session: "Keep the session in an HttpOnly, Secure, SameSite cookie set by the backend; never a token in script, storage or the URL.",
};

const confirms = new Set(["alert-dialog", "approval-card", "dropdown-menu", "tool-call", "approval-inbox"]);

export type AgentDoc = { name: string; title: string; category: string; description: string; url: string; install: string; text: string };

function componentText(c: ComponentDoc, url: string, install: string) {
  const parts = apiParts(c);
  const s = c.security;
  const rules = [...new Set([...s.sinks.map((k) => sinkRule[k]), ...(confirms.has(c.name) ? [RULES[4]] : [])])];
  return [
    `## ${c.title} (${c.name})`,
    "",
    `${url} · ${c.category}`,
    "",
    c.description,
    "",
    `Install: \`${install}\``,
    "",
    "Usage:",
    "",
    "```tsx",
    c.usage,
    "```",
    "",
    "API:",
    ...parts.flatMap((p) => [
      "",
      `### ${p.name}`,
      ...(p.description ? [p.description] : []),
      ...p.props.map((prop) => `- ${prop.name}: ${prop.type}${prop.default ? ` (default ${prop.default})` : ""}. ${prop.description}`),
    ]),
    "",
    `Security: sinks ${s.sinks.length ? s.sinks.join(", ") : "none"}.`,
    ...(s.defenses ?? []).map((d) => `- ${d.title}: ${d.text}${d.ids.length ? ` (${d.ids.join(", ")})` : ""}`),
    ...(s.backend ? [`- Still on your backend: ${s.backend}`] : []),
    ...(s.notes ?? []).map((n) => `- ${n}`),
    ...(rules.length ? ["", "Rules:", ...rules.map((r) => `- ${r}`)] : []),
  ].join("\n");
}

/** Every component, hook, library and block, as the text a coding agent reads (llms-full.txt, the docs MCP server). */
export function agentDocs(): AgentDoc[] {
  return [
    ...components.map((c) => {
      const url = `${SITE}/docs/${c.name}`;
      const install = `npx ${CLI} add ${c.name}`;
      return { name: c.name, title: c.title, category: c.category, description: c.description, url, install, text: componentText(c, url, install) };
    }),
    ...blocks.map((b) => {
      const url = `${SITE}/blocks/${b.name}`;
      const install = `npx ${CLI} add ${b.name}`;
      const text = [
        `## ${b.title} (${b.name}, block)`,
        "",
        `${url} · Blocks`,
        "",
        b.description,
        "",
        `Install: \`${install}\``,
        "",
        "Usage:",
        "",
        "```tsx",
        b.usage,
        "```",
        "",
        "Security: every item inside keeps its own defenses.",
        ...b.defenses.map((d) => `- ${d.title}: ${d.text}${d.ids.length ? ` (${d.ids.join(", ")})` : ""}`),
        `- Still on your backend: ${b.backend}`,
        "",
        "Rules:",
        ...RULES.slice(1).map((r) => `- ${r}`),
      ].join("\n");
      return { name: b.name, title: b.title, category: "Blocks", description: b.description, url, install, text };
    }),
  ];
}

const header = (title: string) => [
  `# ${title}`,
  "",
  "> Secure-by-default React components for building AI platforms: agent chat, approvals, hand raises, usage ceilings and the app shell around them. Built on Base UI, installed as source with a CLI that verifies every release.",
  "",
  "Rules for coding agents:",
  "",
  ...RULES.map((r) => `- ${r}`),
  "",
];

/** /llms.txt: the index (llmstxt.org). */
export function llmsTxt() {
  const docs = agentDocs();
  const line = (title: string, url: string, description: string) => `- [${title}](${url}): ${description}`;
  return [
    ...header("Aedis UI"),
    "## Guides",
    "",
    ...guides.map((g) => line(g.title, `${SITE}${g.href}`, g.description)),
    "",
    "## Components, hooks and libraries",
    "",
    ...docs.filter((d) => d.category !== "Blocks").map((d) => line(d.title, d.url, d.description)),
    "",
    "## Blocks",
    "",
    ...docs.filter((d) => d.category === "Blocks").map((d) => line(d.title, d.url, d.description)),
    "",
    "## Optional",
    "",
    line("Full docs for agents", `${SITE}/llms-full.txt`, "every entry with its install command, usage, API, security and rules"),
    `- Docs MCP server: \`npx ${CLI} mcp\` (stdio; list_components, search_components, get_component, get_install_command)`,
    "",
  ].join("\n");
}

/** /llms-full.txt: every entry in full. */
export function llmsFullTxt() {
  return [...header("Aedis UI: full docs for coding agents"), ...agentDocs().flatMap((d) => [d.text, ""])].join("\n");
}
