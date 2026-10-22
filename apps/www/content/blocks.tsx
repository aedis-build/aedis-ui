import type { ComponentType } from "react";

import type { Accessibility, Defense } from "@/content/components";
import AgentConsoleDemo from "@/examples/blocks/agent-console";
import ApprovalInboxDemo from "@/examples/blocks/approval-inbox";
import SecureShellDemo from "@/examples/blocks/secure-shell";
import UsageLimitsDemo from "@/examples/blocks/usage-limits";

/**
 * A whole screen built only from registry items, installed with `aedis add <name>`. The Code tab shows the block's
 * own file; its sinks are the union of the items inside it (registry.json), plus the defenses of the block itself.
 */
export type BlockDoc = {
  name: string;
  title: string;
  description: string;
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
];
