import type { ComponentType } from "react";

import { components, type Accessibility, type Defense, type Security, type Sink } from "@/content/components";
import AgentConsoleDemo from "@/examples/blocks/agent-console";
import CtaSectionDemo from "@/examples/blocks/cta-section";
import HeroDemo from "@/examples/blocks/hero";
import LogoCloudDemo from "@/examples/blocks/logo-cloud";
import ProofListDemo from "@/examples/blocks/proof-list";
import ApprovalInboxDemo from "@/examples/blocks/approval-inbox";
import SecureShellDemo from "@/examples/blocks/secure-shell";
import UsageLimitsDemo from "@/examples/blocks/usage-limits";
import registry from "@/registry.json";

/** The tabs of the Blocks page, in the board's order; a category may have no block yet. */
export const blockCategories = ["AI platform", "Approvals", "Usage and limits", "Secure shell", "Micro-frontends", "Marketing"] as const;

/**
 * A whole screen built only from registry items, installed with `aedis add <name>`. The Code tab shows the block's
 * own file; its sinks are the union of the items inside it (registry.json), plus the defenses of the block itself.
 */
export type BlockDoc = {
  name: string;
  title: string;
  description: string;
  category: (typeof blockCategories)[number];
  /** Height of the preview frame, in px: the block's own height at desktop width. */
  height: number;
  demo: ComponentType;
  /** The demo's file in examples/blocks, wired with sample data. */
  demoFile: string;
  usage: string;
  defenses: Defense[];
  backend: string;
  accessibility: Accessibility;
};

export const blocks: BlockDoc[] = [
  {
    name: "agent-console",
    title: "Agent Console",
    description: "A conversation with an agent: streaming answers as safe markdown, tool calls with redaction, sources with their real domain, and a prompt input with Stop.",
    category: "AI platform",
    height: 640,
    demo: AgentConsoleDemo,
    demoFile: "blocks/agent-console",
    usage: `import { AgentConsole } from "@/components/ui/agent-console";

<AgentConsole
  title="Sales agent"
  turns={turns}
  onSend={(message, { signal }) => ask(conversationId, message, { signal })}
/>`,
    defenses: [
      {
        title: "Every piece keeps its own defenses",
        text: "People's text stays text, answers go through Markdown, tool arguments are redacted and sources show their real domain.",
        evidence: [["blocks.test.tsx", "shows people's text as text, the agent's answer as safe markdown, redacted tools and real domains"]],
        ids: ["CWE-79", "OWASP LLM05:2025", "OWASP LLM02:2025"],
      },
    ],
    backend: "authorize every tool call, keep prompt-injection guardrails in the agent, and cancel the work when the request's signal aborts.",
    accessibility: {
      keyboard: [["Enter", "Sends."], ["Shift+Enter", "Adds a line."]],
      notes: ["The conversation is a log named by the title, announced politely as answers arrive; answers are aria-busy while they stream."],
      motion: "Answers stream with a caret and tool details open on a spring. With reduced motion there is no caret and nothing springs.",
    },
  },
  {
    name: "approval-inbox",
    title: "Approval Inbox",
    description: "Pending approvals and raised hands in one list, with the ApprovalCard or HandRaise of the one selected.",
    category: "Approvals",
    height: 560,
    demo: ApprovalInboxDemo,
    demoFile: "blocks/approval-inbox",
    usage: `import { ApprovalInbox } from "@/components/ui/approval-inbox";

<ApprovalInbox
  approvals={approvals}
  hands={hands}
  onApprove={(id) => approve(id)}
  onRequestChanges={(id, reason) => requestChanges(id, reason)}
  onAnswer={(id, text, scope) => answerQuestion(id, text, scope)}
/>`,
    defenses: [
      {
        title: "Only the selected request, only after confirming",
        text: "Approving goes through the ApprovalCard's AlertDialog, which starts on Cancel, and calls back with the id of the request on screen.",
        evidence: [["blocks.test.tsx", "opens the first approval, approves the selected one only after confirming, and answers hands"]],
        ids: ["OWASP LLM06:2025"],
      },
    ],
    backend: "authorize each approval and answer, check the request is still pending, and record who decided.",
    accessibility: {
      keyboard: [["← →", "Switches between Approvals and Raised hands."], ["Tab / Enter", "Moves through the list and opens a request."]],
      notes: ["The open request is marked with aria-current; counts are part of each tab's name."],
    },
  },
  {
    name: "usage-limits",
    title: "Usage and Limits",
    description: "Spend per agent against its ceiling, with a warning near the limit and an error once an agent is paused.",
    category: "Usage and limits",
    height: 620,
    demo: UsageLimitsDemo,
    demoFile: "blocks/usage-limits",
    usage: `import { UsageLimits } from "@/components/ui/usage-limits";

<UsageLimits currency="USD" period="Today" agents={usage} warnAt={0.8} />`,
    defenses: [
      {
        title: "A paused agent interrupts",
        text: "Reaching the ceiling (or a ceiling of zero) raises an alert; nearing it raises a polite warning.",
        evidence: [["blocks.test.tsx", "warns near the ceiling, interrupts once paused, and treats a zero ceiling as paused"]],
        ids: ["OWASP LLM10:2025", "CWE-770"],
      },
    ],
    backend: "enforce the ceiling where the agent runs; this block only shows it.",
    accessibility: {
      notes: ["Paused agents are announced as an alert, agents near the limit as a status; each bar is a named progressbar.", "Amounts are formatted for the reader's locale."],
      motion: "Bars move to new values on a spring. With reduced motion they jump.",
    },
  },
  {
    name: "secure-shell",
    title: "Secure Shell",
    description: "The signed-in frame of an app: AppShell while the session is active, sign-out after idle time, and a clear state when the session ends.",
    category: "Secure shell",
    height: 520,
    demo: SecureShellDemo,
    demoFile: "blocks/secure-shell",
    usage: `import { SecureShell } from "@/components/ui/secure-shell";

<SecureShell
  title="Approvals"
  sidebar={<Sidebar groups={groups} />}
  session={session}
  idleMinutes={15}
  onIdle={() => signOut("idle")}
  signInHref="/sign-in"
>
  {children}
</SecureShell>`,
    defenses: [
      {
        title: "Idle sessions end and nothing stays on screen",
        text: "After the idle time it calls onIdle; once the session is not active, the content is unmounted and a sign-in state replaces it.",
        evidence: [["blocks.test.tsx", "signs out after the idle time and removes the content once the session ends"], ["use-idle-timeout.test.tsx", "fires at once when the tab comes back past the limit"]],
        ids: ["CWE-613", "OWASP A07:2021", "ATT&CK T1185"],
      },
    ],
    backend: "revoke the session in onIdle, and answer 401 when it is gone so the app can set session to \"expired\".",
    accessibility: {
      keyboard: [["Enter / Space", "On small screens, the menu toggle opens the sidebar."]],
      notes: ["The ended states are plain headings and text with a Sign in link, so nothing interrupts a screen reader mid-sentence."],
    },
  },
  {
    name: "hero",
    title: "Hero",
    description: "The top of a marketing page: eyebrow, headline, lead and actions as real HTML, with a media slot for a Slideshow or a background Video.",
    category: "Marketing",
    height: 560,
    demo: HeroDemo,
    demoFile: "blocks/hero",
    usage: `import { Hero } from "@/components/ui/hero";
import { Slideshow } from "@/components/ui/carousel";

<Hero
  eyebrow="RLFN Studio"
  headline="Brands that people remember,"
  highlight="from the first mark to the last film."
  lead="Identity, websites and film for small companies."
  actions={[{ label: "See the work", href: "/work" }, { label: "Start a project", href: "/contact", variant: "outline" }]}
  media={<Slideshow label="Selected work" className="h-full">{frames}</Slideshow>}
/>`,
    defenses: [
      {
        title: "Actions only to safe URLs",
        text: "Every action goes through safeUrl: a javascript: or malformed URL is left out, and external links get noopener noreferrer.",
        evidence: [["marketing-blocks.test.tsx", "renders real headings and text, and leaves out actions whose URL is refused"]],
        ids: ["CWE-79", "CWE-601"],
      },
    ],
    backend: "keep the copy in your CMS as text; the hero renders it as text.",
    accessibility: {
      notes: [
        "The headline is the page's h1 and the copy is in the HTML, readable without JavaScript.",
        "highlight ends the headline on its own line in the highlight token (4.5:1 on surface and background in every theme). It is part of the h1's text, so its accessible name is the whole sentence.",
        "The media slot keeps the rules of what goes in it: a background Video has its pause button, a Slideshow its own.",
      ],
      motion: "Only the media moves, and only as its own rules allow.",
    },
  },
  {
    name: "logo-cloud",
    title: "Logo Cloud",
    description: "The clients a studio has worked with, as logos or names.",
    category: "Marketing",
    height: 260,
    demo: LogoCloudDemo,
    demoFile: "blocks/logo-cloud",
    usage: `import { LogoCloud } from "@/components/ui/logo-cloud";

<LogoCloud title="Trusted by" clients={[{ name: "Bakery", logo: "/logos/bakery.svg", width: 96, height: 32 }, { name: "Wine bar" }]} />
<LogoCloud variant="row" label="Stack" clients={stack} />`,
    defenses: [
      {
        title: "Names stay text, links stay safe",
        text: "A logo is an image named by the client; a name without a logo is text; links go through the safe Link.",
        evidence: [["marketing-blocks.test.tsx", "names every client, by its logo's alt or as text"]],
        ids: ["CWE-79"],
      },
    ],
    backend: "serve logos from this origin or one the CSP img-src allows.",
    accessibility: {
      notes: [
        "A list in a section named by its heading, or by label (the Locale provider's \"Clients\" by default) when there is no title. Each logo's alt is the client's name.",
        "variant=\"row\" splits the logos with hairline dividers drawn as borders, so they are never read. A wrapped line never starts with a divider and none follows the last logo.",
        "Give each logo its width and height so the row does not shift while the images load.",
      ],
    },
  },
  {
    name: "cta-section",
    title: "CTA Section",
    description: "A closing call to action: a headline, a line and the actions.",
    category: "Marketing",
    height: 320,
    demo: CtaSectionDemo,
    demoFile: "blocks/cta-section",
    usage: `import { CtaSection } from "@/components/ui/cta-section";

<CtaSection headline="Have a project in mind?" actions={[{ label: "Start a project", href: "/contact" }]} />`,
    defenses: [
      {
        title: "Actions only to safe URLs",
        text: "The demo passes a javascript: action: safeUrl refuses it and the button is left out.",
        evidence: [["marketing-blocks.test.tsx", "renders real headings and text, and leaves out actions whose URL is refused"]],
        ids: ["CWE-79", "CWE-601"],
      },
    ],
    backend: "nothing: it only links.",
    accessibility: { notes: ["The headline is an h2; the actions are links styled as buttons."] },
  },
  {
    name: "proof-list",
    title: "Proof List",
    description: "Short facts with optional numerals, e.g. years in practice or clients who return.",
    category: "Marketing",
    height: 320,
    demo: ProofListDemo,
    demoFile: "blocks/proof-list",
    usage: `import { ProofList } from "@/components/ui/proof-list";

<ProofList items={[{ value: "12", label: "Years in practice" }, { label: "Independent", detail: "No holding." }]} />`,
    defenses: [],
    backend: "keep the numbers true: they are claims.",
    accessibility: { notes: ["A description list: each label is the term and its numeral and detail describe it, so a screen reader says \"Years in practice, 12\"."] },
  },
];

/** The items a block is built from (registry.json), and its security panel: their sinks plus the block's defenses. */
export function blockSecurity(block: BlockDoc): { parts: typeof components; security: Security } {
  const item = registry.items.find((i) => i.name === block.name);
  const parts = (item?.registryDependencies ?? []).flatMap((d) => components.filter((c) => c.name === d.replace("@aedis/", "")));
  const order: Sink[] = ["DOM", "Input", "Transport", "Session"];
  return {
    parts,
    security: {
      sinks: order.filter((s) => parts.some((p) => p.security.sinks.includes(s))),
      defenses: block.defenses,
      backend: block.backend,
      notes: [`Every item inside keeps its own defenses: see the security of ${parts.map((p) => p.title).join(", ")}.`],
    },
  };
}
