import type { ComponentType } from "react";

import AccordionDemo from "@/examples/accordion/demo";
import AlertDialogDemo from "@/examples/alert-dialog/demo";
import AlertDemo from "@/examples/alert/demo";
import AppShellDemo from "@/examples/app-shell/demo";
import AreaChartDemo from "@/examples/area-chart/demo";
import ApprovalCardDemo from "@/examples/approval-card/demo";
import AvatarDemo from "@/examples/avatar/demo";
import BadgeDemo from "@/examples/badge/demo";
import BarChartDemo from "@/examples/bar-chart/demo";
import BarChartMonth from "@/examples/bar-chart/month";
import BreadcrumbDemo from "@/examples/breadcrumb/demo";
import ButtonGroupDemo from "@/examples/button-group/demo";
import ButtonGroupVerticalText from "@/examples/button-group/vertical-text";
import ButtonAsLink from "@/examples/button/as-link";
import ButtonShapes from "@/examples/button/shapes";
import ButtonDemo from "@/examples/button/demo";
import ButtonSizes from "@/examples/button/sizes";
import CardDemo from "@/examples/card/demo";
import ChartDemo from "@/examples/chart/demo";
import ChatDemo from "@/examples/chat/demo";
import CheckboxDemo from "@/examples/checkbox/demo";
import CodeBlockDemo from "@/examples/code-block/demo";
import CollapsibleDemo from "@/examples/collapsible/demo";
import CommandDemo from "@/examples/command/demo";
import DialogDemo from "@/examples/dialog/demo";
import DropdownMenuCheckboxRadio from "@/examples/dropdown-menu/checkbox-radio";
import DropdownMenuDemo from "@/examples/dropdown-menu/demo";
import DropdownMenuSubmenu from "@/examples/dropdown-menu/submenu-disabled";
import EmptyDemo from "@/examples/empty/demo";
import FeedbackDemo from "@/examples/feedback/demo";
import HandRaiseDemo from "@/examples/hand-raise/demo";
import InputDemo from "@/examples/input/demo";
import InputStates from "@/examples/input/states";
import ItemDemo from "@/examples/item/demo";
import KbdDemo from "@/examples/kbd/demo";
import LabelDemo from "@/examples/label/demo";
import LineChartDemo from "@/examples/line-chart/demo";
import LinkDemo from "@/examples/link/demo";
import LocaleSwitcherDemo from "@/examples/locale-switcher/demo";
import MarkdownDemo from "@/examples/markdown/demo";
import NavigationMenuDemo from "@/examples/navigation-menu/demo";
import PaginationDemo from "@/examples/pagination/demo";
import PieChartDemo from "@/examples/pie-chart/demo";
import ProgressDemo from "@/examples/progress/demo";
import PromptInputDemo from "@/examples/prompt-input/demo";
import RadioGroupDemo from "@/examples/radio-group/demo";
import RadialChartDemo from "@/examples/radial-chart/demo";
import ScrollAreaDemo from "@/examples/scroll-area/demo";
import SeparatorDemo from "@/examples/separator/demo";
import ShareCardDemo from "@/examples/share-card/demo";
import SheetDemo from "@/examples/sheet/demo";
import SidebarDemo from "@/examples/sidebar/demo";
import SiteFooterDemo from "@/examples/site-footer/demo";
import SiteHeaderDemo from "@/examples/site-header/demo";
import SkeletonDemo from "@/examples/skeleton/demo";
import SourcesDemo from "@/examples/sources/demo";
import SpinnerDemo from "@/examples/spinner/demo";
import StreamingMarkdownDemo from "@/examples/streaming-markdown/demo";
import SwitchDemo from "@/examples/switch/demo";
import TableDemo from "@/examples/table/demo";
import TabsDemo from "@/examples/tabs/demo";
import TextareaDemo from "@/examples/textarea/demo";
import ToastDemo from "@/examples/toast/demo";
import ToolCallDemo from "@/examples/tool-call/demo";
import TooltipDemo from "@/examples/tooltip/demo";
import FieldDemo from "@/examples/field/demo";
import FieldServerErrors from "@/examples/field/server-errors";
import FieldsetDemo from "@/examples/fieldset/demo";
import SelectDemo from "@/examples/select/demo";
import ComboboxDemo from "@/examples/combobox/demo";
import ToggleDemo from "@/examples/toggle/demo";
import ToggleGroupDemo from "@/examples/toggle-group/demo";
import ToggleGroupSegmented from "@/examples/toggle-group/segmented";
import CopyButtonDemo from "@/examples/copy-button/demo";
import SecurityHeadersBuilder from "@/examples/security-headers/builder";
import SecurityHeadersCache from "@/examples/security-headers/cache";
import MediaFrameDemo from "@/examples/media-frame/demo";
import CarouselDemo from "@/examples/carousel/demo";
import CarouselSlideshow from "@/examples/carousel/slideshow";
import VideoDemo from "@/examples/video/demo";
import VideoBackground from "@/examples/video/background";
import LightboxDemo from "@/examples/lightbox/demo";
import ScrollMotionDemo from "@/examples/scroll-motion/demo";
import ScrollMotionPin from "@/examples/scroll-motion/pin";
import ScrollMotionPinMedia from "@/examples/scroll-motion/pin-media";
import CustomThemeFonts from "@/examples/custom-theme/fonts";
import AbuseGateSimulator from "@/examples/abuse-gate/simulator";
import BruteForceGuardSimulator from "@/examples/brute-force-guard/simulator";
import FormTokenSimulator from "@/examples/form-token/simulator";
import ApiSimulator from "@/examples/api/simulator";
import UntrustedInspector from "@/examples/untrusted/inspector";
import SecureActionSimulator from "@/examples/secure-action/simulator";
import EventStreamSimulator from "@/examples/event-stream/simulator";
import UseEventStreamSimulator from "@/examples/use-event-stream/simulator";
import BffStreamSimulator from "@/examples/bff-stream/simulator";
import UseIdleTimeoutDemo from "@/examples/use-idle-timeout/demo";
import UseReducedMotionDemo from "@/examples/use-reduced-motion/demo";
import UseFormatDemo from "@/examples/use-format/demo";
import LocaleDemo from "@/examples/locale/demo";
import ShareMetadataBuilder from "@/examples/share-metadata/builder";
import MfFrameDemo from "@/examples/mf-frame/demo";
import MfBridgeDemo from "@/examples/mf-bridge/demo";
import MfContextDemo from "@/examples/mf-context/demo";
import MfElementDemo from "@/examples/mf-element/demo";
import RedactInspector from "@/examples/redact/inspector";
import UseStickToBottomDemo from "@/examples/use-stick-to-bottom/demo";
import MfEmbedHeadersBuilder from "@/examples/mf-embed-headers/builder";
import AttachmentChecker from "@/examples/attachment/checker";
import ReasoningDemo from "@/examples/reasoning/demo";

export type Prop = { name: string; type: string; default?: string; description: string };

/** The API reference by part: rows named like "SheetContent labels" go to SheetContent, then the explicit parts. */
export function apiParts(doc: ComponentDoc): ApiPart[] {
  const byPart = new Map<string, Prop[]>([[doc.title.replace(/\s/g, ""), []]]);
  for (const p of doc.props) {
    const [, part, prop] = /^([A-Z]\w+) ([a-z].*)$/.exec(p.name) ?? [];
    const key = part ?? [...byPart.keys()][0];
    byPart.set(key, [...(byPart.get(key) ?? []), part ? { ...p, name: prop } : p]);
  }
  return [...[...byPart].filter(([, props]) => props.length).map(([name, props]) => ({ name, props })), ...(doc.parts ?? [])];
}

/** Sidebar and gallery order: the guides first (as the Docs board groups them), then the components by category. */
export const categories = ["Getting started", "Security", "Micro-frontends", "For agents", "Foundations", "Actions", "Forms", "Overlays", "Navigation", "Feedback", "Data display", "Charts", "AI and agents", "Transport", "Blocks"] as const;
export type Category = (typeof categories)[number];

/** A file in examples/: rendered in Preview, its source shown in Code. A test checks `component` is that file's export. */
export type Example = {
  title: string;
  description?: string;
  file: string;
  component: ComponentType;
  /** "start" for an example that grows when used (an accordion): centred, it would move under the pointer as it opens. */
  align?: "center" | "start";
};

/** One exported part, e.g. DropdownMenuItem, with its own props. */
export type ApiPart = { name: string; description?: string; props: Prop[] };

export type Accessibility = {
  /** Key, then what it does. */
  keyboard?: [key: string, action: string][];
  /** Roles, names and what a screen reader announces. */
  notes?: string[];
  /** What moves, and what reduced motion changes. */
  motion?: string;
};

/** The four places a UI can be attacked through (docs/SECURITY-BY-CONSTRUCTION.md). */
export type Sink = "DOM" | "Input" | "Transport" | "Session";

/** The test that proves a defense: a file in apps/www/test and the test's name. The docs build fails if either is missing. */
export type Evidence = [file: string, test: string];

export type Defense = {
  title: string;
  text: string;
  evidence: [Evidence, ...Evidence[]];
  /** CWE, OWASP (Top 10 2021, LLM 2025), MITRE ATT&CK and ATLAS ids it answers. */
  ids: string[];
};

/** The security panel: what the item touches, how it defends it, and what stays on the server. */
export type Security = { sinks: Sink[]; defenses?: Defense[]; backend?: string; notes?: string[] };

export type ComponentDoc = {
  name: string;
  title: string;
  category: Category;
  description: string;
  /** The first is the main preview; the rest are listed under Examples. Every UI item has one (test/examples.test.ts). */
  examples?: Example[];
  /** The smallest correct use, imports included. */
  usage: string;
  props: Prop[];
  /** Subcomponents after the main one, each with its own props. */
  parts?: ApiPart[];
  /** Required for UI items (test/examples.test.ts); hooks and libraries document it when they affect it. */
  accessibility?: Accessibility;
  security: Security;
};

const baseProps = (part: string): Prop[] => [
  { name: "...props", type: `${part} props`, description: "Every prop of the underlying Base UI part, including render for composition." },
];

/** The written guides; they join the navigation and the search next to the components. */
export const guides: { href: string; title: string; description: string; category: Category }[] = [
  { href: "/docs", title: "Introduction", description: "What Aedis UI is and where to start.", category: "Getting started" },
  { href: "/docs#installation", title: "Installation", description: "init once, then add components with the CLI that verifies every release.", category: "Getting started" },
  { href: "/docs/theming", title: "Theming", description: "The color, type, depth, shape and motion tokens.", category: "Getting started" },
  { href: "/themes", title: "Themes", description: "Create your own theme, check its contrast and import it with the CLI.", category: "Getting started" },
  { href: "/create", title: "Create", description: "Pick a theme, blocks and a security level; get one init command.", category: "Getting started" },
  { href: "/typeset", title: "Typeset", description: "Set the type scale on real content and import it as a theme.", category: "Getting started" },
  { href: "/blocks", title: "Blocks", description: "Whole screens for AI platforms, built only from registry items.", category: "Blocks" },
  { href: "/charts", title: "Charts", description: "Every chart type with sample data, and how charts stay safe.", category: "Charts" },
  { href: "/directory", title: "Directory", description: "Registries the Aedis CLI can verify, and how to list yours.", category: "Security" },
  { href: "/security", title: "Security by construction", description: "How each attack is treated, the four sinks, the checklist for apps and what the UI cannot do.", category: "Security" },
  { href: "/docs/server-actions", title: "Server Actions", description: "Keep every Server Action safe with secureAction.", category: "Transport" },
  { href: "/micro-frontends", title: "Overview", description: "Micro-frontends without giving up the CSP: the approaches and what the kit defends.", category: "Micro-frontends" },
  { href: "/docs/micro-frontends", title: "Choosing an approach", description: "Compose apps from isolated frames and elements; Multi-Zones on one site.", category: "Micro-frontends" },
  { href: "/llms.txt", title: "llms.txt", description: "Every page and item, indexed for coding agents.", category: "For agents" },
  { href: "/llms-full.txt", title: "llms-full.txt", description: "Every entry in full, in one file.", category: "For agents" },
  { href: "/docs#for-agents", title: "MCP server", description: "A read-only docs server for coding agents: aedis mcp.", category: "For agents" },
];

/** One entry per registry item. The docs page and the sidebar are generated from this list. */
export const components: ComponentDoc[] = [
  {
    name: "app-shell",
    title: "App Shell",
    category: "Navigation",
    description: "Sidebar and main region. Below md, the sidebar hides behind a menu toggle in a top bar.",
    examples: [{ title: "App Shell", file: "app-shell/demo", component: AppShellDemo }],
    usage: `import { AppShell } from "@/components/ui/app-shell";
import { Sidebar } from "@/components/ui/sidebar";

<AppShell title="Approvals" sidebar={<Sidebar groups={groups} />}>
  {children}
</AppShell>`,
    props: [
      { name: "sidebar", type: "ReactNode", description: "The navigation, usually a Sidebar." },
      { name: "title", type: "ReactNode", description: "Shown in the top bar on small screens." },
      { name: "menuLabel", type: "string", description: "Accessible name of the menu toggle. Defaults to the Locale provider." },
    ],
    security: { sinks: [], notes: ["The toggle exposes aria-expanded and aria-controls; the sidebar stays a navigation landmark."] },
    accessibility: {
      keyboard: [["Enter / Space", "On small screens, the menu toggle opens and closes the sidebar."]],
      notes: ["The toggle has aria-expanded and aria-controls pointing at the sidebar; its name comes from the Locale provider (\"Menu\")."],
    },
  },
  {
    name: "approval-card",
    title: "Approval Card",
    category: "AI and agents",
    description: "A request from an agent that waits for a human before anything leaves the company.",
    examples: [{ title: "Approval Card", file: "approval-card/demo", component: ApprovalCardDemo }],
    usage: `import { ApprovalCard } from "@/components/ui/approval-card";

<ApprovalCard
  requester={request.agent}
  requestedAt={f.relative(request.createdAt)}
  content={request.markdown}
  onApprove={() => approve(request.id)}
  onRequestChanges={(reason) => requestChanges(request.id, reason)}
/>`,
    props: [
      { name: "requester", type: "string", description: "Who asks, usually the agent's name." },
      { name: "content", type: "string", description: "What is being approved, as untrusted markdown." },
      { name: "requestedAt", type: "string", description: "Already formatted time." },
      { name: "onApprove", type: "() => Promise<string | null>", description: "Resolve with an error message to show it, or null." },
      { name: "onRequestChanges", type: "(reason) => Promise<string | null>", description: "Called with the required reason." },
      { name: "labels", type: "Partial<ApprovalCardLabels>", description: "Override single strings; the rest comes from the Locale provider (English by default)." },
    ],
    security: {
      sinks: ["DOM", "Input"],
      defenses: [
        {
          title: "Approving needs a confirmation that starts on Cancel",
          text: "Approve opens an AlertDialog with focus on Cancel; the app can relabel it, not skip it.",
          evidence: [["human-in-the-loop.test.tsx", "approves only after confirming"], ["base-ui.test.tsx", "alert dialog starts on Cancel even when the footer puts it last"]],
          ids: ["OWASP LLM06:2025", "ATLAS AML.T0051"],
        },
        {
          title: "The request is rendered as data",
          text: "Content renders through Markdown: no raw HTML, safe link protocols, hidden code points removed.",
          evidence: [["human-in-the-loop.test.tsx", "renders the content as safe markdown"]],
          ids: ["CWE-79", "OWASP A03:2021", "OWASP LLM05:2025"],
        },
        {
          title: "Changes need a reason",
          text: "Requesting changes requires a non-empty reason, so the agent gets an instruction, not a bare refusal.",
          evidence: [["human-in-the-loop.test.tsx", "requires a reason to request changes"]],
          ids: ["OWASP LLM06:2025"],
        },
      ],
      backend: "authorize the approval and record who gave it; the dialog protects people from a slip, never from an attacker.",
    },
    accessibility: {
      keyboard: [["Enter", "In the confirmation, activates Cancel first: approving takes a deliberate Tab."], ["Esc", "Closes the confirmation without approving."]],
      notes: ["Approve opens an AlertDialog that starts on Cancel; a failure is shown as role=\"alert\".", "Requesting changes needs a non-empty reason in a labelled field."],
      motion: "The confirmation materializes and closes in 200 ms. With reduced motion it only fades.",
    },
  },
  {
    name: "hand-raise",
    title: "Hand Raise",
    category: "AI and agents",
    description: "A question an agent could not resolve with the knowledge base or its colleagues.",
    examples: [{ title: "Hand Raise", file: "hand-raise/demo", component: HandRaiseDemo }],
    usage: `import { HandRaise } from "@/components/ui/hand-raise";

<HandRaise
  agent="Otto"
  question={question.text}
  tried={question.tried}
  onAnswer={(answer, scope) => answerQuestion(question.id, answer, scope)}
/>`,
    props: [
      { name: "agent", type: "string", description: "The agent asking." },
      { name: "question", type: "string", description: "Plain text." },
      { name: "tried", type: "string | null", description: "What the agent already tried." },
      { name: "onAnswer", type: '(answer, scope: "once" | "always") => Promise<string | null>', description: "Resolve with an error message, or null." },
      { name: "labels", type: "Partial<HandRaiseLabels>", description: "Override single strings; the rest comes from the Locale provider (English by default)." },
    ],
    security: {
      sinks: ["DOM", "Input"],
      defenses: [
        {
          title: "The question is plain text",
          text: "What the agent asks is shown as text, never as markup.",
          evidence: [["human-in-the-loop.test.tsx", "renders the question as plain text"]],
          ids: ["CWE-79", "OWASP LLM05:2025"],
        },
        {
          title: "A lasting rule is never the default",
          text: "Scope starts at \"Just this case\"; \"Always\" says the answer becomes a lasting rule before it is sent.",
          evidence: [["human-in-the-loop.test.tsx", "answers just this case by default and always when chosen"]],
          ids: ["OWASP LLM06:2025"],
        },
      ],
      backend: "treat the answer as untrusted input to the agent, and let only people allowed to set policy create lasting rules.",
    },
    accessibility: {
      keyboard: [["↑ ↓", "Moves between \"Just this case\" and \"Always\"."]],
      notes: ["The answer field and the scope radio group are labelled; \"Always\" says it becomes a lasting rule before it is sent.", "A failure is shown as role=\"alert\"."],
    },
  },
  {
    name: "chat",
    title: "Chat",
    category: "AI and agents",
    description: "Conversation with an agent. Agent messages render as safe markdown; people's messages as plain text.",
    examples: [{ title: "Chat", file: "chat/demo", component: ChatDemo }],
    usage: `import { Chat } from "@/components/ui/chat";

<Chat messages={messages} onSend={(text) => send(conversationId, text)} working={agentTyping ? "Avalo is writing…" : undefined} />`,
    props: [
      { name: "messages", type: "{ id; author; role: \"person\" | \"agent\" | \"system\"; content }[]", description: "The conversation. Content is untrusted." },
      { name: "onSend", type: "(text) => Promise<void>", description: "Send the text; throw to keep the draft and show the error." },
      { name: "working", type: "string", description: "Indicator while the agent works." },
      { name: "maxLength", type: "number", default: "8000", description: "Match your server limit." },
      { name: "labels", type: "Partial<ChatLabels>", description: "placeholder, send, message, log, sendError." },
    ],
    security: {
      sinks: ["DOM", "Input"],
      defenses: [
        {
          title: "Agent output is data",
          text: "Agent messages go through Markdown (no raw HTML, only safe links); people's messages are plain text.",
          evidence: [["chat.test.tsx", "renders agent messages as markdown and people's messages as plain text"], ["chat.test.tsx", "drops raw HTML and unsafe links"]],
          ids: ["CWE-79", "OWASP A03:2021", "OWASP LLM05:2025"],
        },
        {
          title: "Hidden instructions never travel",
          text: "stripInvisible runs on what is sent and on what is shown, so Unicode tags and bidi tricks cannot reach the agent or the reader.",
          evidence: [["chat.test.tsx", "strips hidden code points from what is sent and from what is shown"]],
          ids: ["ATLAS AML.T0051.001", "OWASP LLM01:2025"],
        },
      ],
      backend: "check the length and content of every message again, and keep prompt-injection guardrails in the agent.",
      notes: ["The log region has aria-live, so new messages are announced."],
    },
    accessibility: {
      keyboard: [["Enter", "Sends the draft."], ["Shift+Enter", "Adds a line."]],
      notes: ["The conversation is role=\"log\" with aria-live=\"polite\", so new messages are read as they arrive.", "Composing with an input method (IME) never sends early; a send failure keeps the draft and is shown as role=\"alert\"."],
    },
  },
  {
    name: "locale",
    title: "Locale",
    category: "Foundations",
    description: "Locale provider and dictionaries: every Aedis UI component reads its text from here, in English, Portuguese or Spanish.",
    examples: [{ title: "Switch the locale", description: "The same components, in the words of the chosen dictionary.", file: "locale/demo", component: LocaleDemo }],
    usage: `import { LocaleProvider } from "@/lib/locale";
import { ptBR } from "@/lib/locales/pt-br";

<LocaleProvider locale="pt-BR" messages={ptBR}>
  {children}
</LocaleProvider>`,
    props: [
      { name: "locale", type: "string", description: 'BCP 47 tag the app already resolved, e.g. "pt-BR". Drives formatting too.' },
      { name: "messages", type: "Messages", default: "en", description: "Dictionary: en (built in), ptBR (locale-pt-br) or es (locale-es)." },
      { name: "useMessages(key, labels)", type: "hook", description: "For component authors: a component's strings with the labels prop overriding single entries." },
    ],
    security: { sinks: [], notes: [
      "Without a provider every component stays in English, so adding it never breaks a page.",
      "The labels prop still wins over the dictionary for a single string.",
      "App copy stays in the app (e.g. next-intl); pass its resolved locale here so there is one source of truth.",
      "Sidebar is a Server Component and does not read the provider: pass label={messages.sidebar.label}.",
    ] },
  },
  {
    name: "locale-switcher",
    title: "Locale Switcher",
    category: "Foundations",
    description: "Language picker. The app stores the choice and re-renders the provider.",
    examples: [{ title: "Locale Switcher", file: "locale-switcher/demo", component: LocaleSwitcherDemo }],
    usage: `import { LocaleSwitcher } from "@/components/ui/locale-switcher";

<LocaleSwitcher
  locales={[{ code: "en", label: "English" }, { code: "pt-BR", label: "Português" }, { code: "es", label: "Español" }]}
  onChange={(code) => setLocale(code)}
/>`,
    props: [
      { name: "locales", type: "{ code; label }[]", description: "Options, each label in its own language." },
      { name: "value", type: "string", description: "Selected locale. Defaults to the provider locale." },
      { name: "onChange", type: "(code) => void", description: "Called with the chosen BCP 47 tag." },
      { name: "label", type: "string", description: "Accessible name. Defaults to the dictionary." },
    ],
    security: { sinks: [], notes: ["A native select: keyboard and screen readers work everywhere; each option carries its own lang."] },
    accessibility: {
      notes: ["A native select with an accessible name (\"Language\" by default); each option is labelled in its own language."],
    },
  },
  {
    name: "use-format",
    title: "useFormat",
    category: "Foundations",
    description: "Date, number, currency and relative time in the provider locale, on the platform Intl APIs.",
    examples: [{ title: "Formats by locale", description: "The same values in each locale of the provider.", file: "use-format/demo", component: UseFormatDemo }],
    usage: `import { useFormat } from "@/hooks/use-format";

const f = useFormat();
f.relative(message.createdAt); // "há 4 minutos"
f.currency(449, "BRL");        // "R$ 449,00"
f.date(invoice.dueAt);         // "18 de out. de 2026"`,
    props: [
      { name: "date(value, options?)", type: "string", description: 'Intl.DateTimeFormat; default { dateStyle: "medium" }.' },
      { name: "dateTime(value)", type: "string", description: "Medium date and short time." },
      { name: "number(value, options?)", type: "string", description: "Intl.NumberFormat." },
      { name: "currency(value, code)", type: "string", description: "ISO 4217 code, e.g. BRL or USD." },
      { name: "relative(value, now?)", type: "string", description: '"2 minutes ago", "yesterday", "in 3 days".' },
    ],
    security: { sinks: [], notes: ["No dependency: uses the Intl APIs of the runtime.", "Pass the time zone in options when the server and the viewer differ."] },
  },
  {
    name: "markdown",
    title: "Markdown",
    category: "Data display",
    description: "Renders untrusted markdown from agents or users.",
    examples: [{ title: "Markdown", file: "markdown/demo", component: MarkdownDemo }],
    usage: `import { Markdown } from "@/components/ui/markdown";

<Markdown>{agentReply}</Markdown>`,
    props: [
      { name: "children", type: "string", description: "The markdown." },
      { name: "allowImages", type: "boolean", default: "false", description: "Render images. Off by default: image URLs leak the reader's IP and read receipts." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "No raw HTML",
          text: "Markdown renders without rehype-raw: HTML in the text is shown as text or dropped, never parsed.",
          evidence: [["chat.test.tsx", "drops raw HTML and unsafe links"]],
          ids: ["CWE-79", "OWASP A03:2021", "OWASP LLM05:2025"],
        },
        {
          title: "Safe links only",
          text: "Only http, https, mailto and relative URLs survive; external links open with noopener noreferrer.",
          evidence: [["untrusted.test.ts", "never returns a URL with a protocol outside the allow list (property)"]],
          ids: ["CWE-79", "CWE-601"],
        },
        {
          title: "Images off by default",
          text: "An image in agent output could send data to its host as soon as it renders, so images need allowImages.",
          evidence: [["chat.test.tsx", "blocks images unless allowed"]],
          ids: ["CWE-200", "OWASP LLM02:2025"],
        },
      ],
    },
    accessibility: {
      notes: ["Renders real headings, lists, tables and links, so the structure is navigable; external links are marked."],
    },
  },
  {
    name: "streaming-markdown",
    title: "Streaming Markdown",
    category: "AI and agents",
    description: "Markdown for an agent answer that arrives token by token.",
    examples: [{ title: "Streaming Markdown", file: "streaming-markdown/demo", component: StreamingMarkdownDemo }],
    usage: `import { StreamingMarkdown } from "@/components/ui/streaming-markdown";

<StreamingMarkdown streaming={!done}>{answerSoFar}</StreamingMarkdown>`,
    props: [
      { name: "children", type: "string", description: "The answer so far, as untrusted markdown." },
      { name: "streaming", type: "boolean", default: "false", description: "Tokens still arriving: caret on, incomplete links held back, aria-busy." },
      { name: "maxLength", type: "number", default: "100000", description: "Longer answers are cut." },
      { name: "allowImages", type: "boolean", default: "false", description: "As in Markdown." },
      { name: "settledMarkdown(text)", type: "string", description: "The text rendered while streaming, for custom renderers." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "Markdown's rules while streaming",
          text: "No raw HTML, unsafe links dropped, images off by default, hidden characters removed.",
          evidence: [["streaming-markdown.test.tsx", "keeps Markdown's rules: no raw HTML, unsafe links dropped, images off"]],
          ids: ["CWE-79", "OWASP LLM05:2025"],
        },
        {
          title: "No half-written link is clickable",
          text: "A link becomes clickable only once it closes, and a bare URL only once a space follows it.",
          evidence: [["streaming-markdown.test.tsx", "never makes a half-written URL clickable (property)"], ["streaming-markdown.test.tsx", "holds back links, bare URLs and dangling markers until they complete"]],
          ids: ["CWE-601"],
        },
        {
          title: "A runaway stream cannot freeze the page",
          text: "Rendered at most once per animation frame, with a length cap.",
          evidence: [["streaming-markdown.test.tsx", "renders at most once per animation frame and caps the length"]],
          ids: ["CWE-400", "OWASP LLM10:2025"],
        },
      ],
    },
    accessibility: {
      notes: ["aria-busy while tokens arrive, so screen readers wait for the settled text instead of reading every token."],
      motion: "A caret blinks at the end while streaming. With reduced motion there is no caret.",
    },
  },
  {
    name: "prompt-input",
    title: "Prompt Input",
    category: "AI and agents",
    description: "The composer for an agent chat: bounded text, attachments, a model picker and a send button that turns into stop.",
    examples: [{ title: "Prompt Input", file: "prompt-input/demo", component: PromptInputDemo }],
    usage: `import { PromptInput } from "@/components/ui/prompt-input";

<PromptInput onSend={(message, { signal }) => ask(message, { signal })} />`,
    props: [
      { name: "onSend", type: "(message, { signal }) => Promise<void>", description: "Resolve when the answer is complete; Stop aborts signal. Throw to keep the draft." },
      { name: "maxLength", type: "number", default: "8000", description: "Match your server limit." },
      { name: "attachments", type: "{ accept; maxBytes; uploadPath; maxFiles? }", description: "Turns attachments on: MIME or extension allow-list, size limit, same-origin upload path (default 10 files)." },
      { name: "models / model / onModelChange", type: "{ value; label }[] / string / (value) => void", description: "Optional agent or model picker." },
      { name: "labels", type: "Partial<PromptInputLabels>", description: "Every string, in the dictionary." },
      { name: "checkAttachment / safeFileName / uploadAttachment", type: "lib", description: "The same rules for your own upload UI." },
    ],
    security: {
      sinks: ["Input", "Transport"],
      defenses: [
        {
          title: "Bounded text without hidden characters",
          text: "The message is trimmed, bounded and stripped of hidden code points before onSend sees it.",
          evidence: [["prompt-input.test.tsx", "sends trimmed text without hidden characters on Enter, keeps Shift+Enter for new lines"]],
          ids: ["ATLAS AML.T0051.001", "OWASP LLM01:2025", "CWE-770"],
        },
        {
          title: "Attachments from an allow-list",
          text: "Type and size limits; an image/* wildcard never admits SVG.",
          evidence: [["prompt-input.test.tsx", "allows only listed types and sizes, never SVG through a wildcard"]],
          ids: ["CWE-434", "CWE-770"],
        },
        {
          title: "File names cannot lie",
          text: "Bidi controls and control characters are removed from shown names (RLO spoofing).",
          evidence: [["prompt-input.test.tsx", "cleans file names of bidi tricks and control characters (property)"]],
          ids: ["CWE-451", "ATT&CK T1036.002"],
        },
        {
          title: "Same-origin uploads",
          text: "Uploads go to a same-origin path with X-Requested-With, and redirects are refused.",
          evidence: [["prompt-input.test.tsx", "uploads same-origin with the custom header, reports progress and refuses redirects"]],
          ids: ["CWE-352", "CWE-601"],
        },
      ],
      backend: "check each file's content again (the browser guesses its type from its name), and cancel the work when the request's signal aborts.",
    },
    accessibility: {
      keyboard: [["Enter", "Sends."], ["Shift+Enter", "Adds a line."], ["Tab", "Reaches Attach, the model picker and Send or Stop."]],
      notes: ["Send and Stop are icon buttons with names from the dictionary; while an answer streams, Send becomes Stop.", "Refused files and failures are shown as role=\"alert\"; composing with an IME never sends early."],
      motion: "Send and Stop swap with a short scale and fade. With reduced motion they swap at once.",
    },
  },
  {
    name: "feedback",
    title: "Feedback",
    category: "AI and agents",
    description: "Thumbs up or down on an agent answer, with an optional comment, for evaluating agents.",
    examples: [{ title: "Feedback", file: "feedback/demo", component: FeedbackDemo }],
    usage: `import { Feedback } from "@/components/ui/feedback";

<Feedback messageId={message.id} endpoint="/api/feedback" />`,
    props: [
      { name: "messageId", type: "string", description: "The answer being rated, from the app; never typed by the person." },
      { name: "endpoint", type: "string", description: "Same-origin path; receives { messageId, rating, comment? } through api()." },
      { name: "maxLength", type: "number", default: "1000", description: "Longest comment." },
      { name: "labels", type: "Partial<FeedbackLabels>", description: "Every string, in the dictionary." },
    ],
    security: {
      sinks: ["Input", "Transport"],
      defenses: [
        {
          title: "Sent through api()",
          text: "Same-origin, X-Requested-With, redirects refused; the message id comes from the app, never typed by the person.",
          evidence: [["feedback.test.tsx", "sends a thumbs up right away through api(), with the message id from the app"]],
          ids: ["CWE-352", "OWASP A01:2021"],
        },
        {
          title: "A bounded comment",
          text: "The comment is bounded and stripped of hidden characters.",
          evidence: [["feedback.test.tsx", "asks what went wrong after a thumbs down, bounded and without hidden characters"]],
          ids: ["CWE-770", "ATLAS AML.T0051.001"],
        },
      ],
      backend: "check that the person saw the message they rate before storing it.",
    },
    accessibility: {
      keyboard: [["Tab", "Reaches the two rating buttons, then the optional comment."]],
      notes: ["The ratings are a labelled group of buttons; the thanks message is a status announced politely."],
      motion: "The thanks message fades in. With reduced motion it appears at once.",
    },
  },
  {
    name: "sources",
    title: "Sources",
    category: "AI and agents",
    description: "Citations for answers grounded in documents: a numbered list and inline markers.",
    examples: [{ title: "Sources", file: "sources/demo", component: SourcesDemo }],
    usage: `import { Citation, Sources } from "@/components/ui/sources";

<p>Shoot days are billed monthly<Citation n={1} idPrefix="answer-42" title="Pricing policy" />.</p>
<Sources idPrefix="answer-42" sources={[{ title: "Pricing policy", url: "https://example.com/pricing" }]} />`,
    props: [
      { name: "Sources sources", type: "{ title; url; snippet? }[]", description: "Titles and snippets are text; URLs go through safeUrl." },
      { name: "Sources idPrefix", type: "string", description: "Anchor prefix shared with the inline Citation markers." },
      { name: "Citation n / idPrefix / title?", type: "number / string / string", description: "Inline marker linking to entry n, named \"Source n: title\"." },
      { name: "sourceDomain(url)", type: "string | null", description: "The host a person lands on, punycode for international names." },
      { name: "labels", type: "Partial<SourcesLabels>", description: "title, source." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "The real domain, next to the title",
          text: "Shown in punycode for international names, so a lookalike domain cannot pass for the real one.",
          evidence: [["sources.test.tsx", "shows the real host, in punycode for international names, and nothing for refused or relative URLs"]],
          ids: ["CWE-1007", "ATT&CK T1566.002"],
        },
        {
          title: "Safe links, no third-party requests",
          text: "Links go through safeUrl and are marked; titles and snippets are text; no favicon is fetched, so nothing leaks who reads the answer.",
          evidence: [["sources.test.tsx", "lists safe, marked links with their domain, as text, and fetches no favicon"]],
          ids: ["CWE-601", "CWE-1022", "CWE-200"],
        },
      ],
    },
    accessibility: {
      keyboard: [["Enter", "On a citation, jumps to its source."]],
      notes: ["Each citation is a link named \"Source n: title\"; the list shows the domain a person lands on before they follow it."],
    },
  },
  {
    name: "tool-call",
    title: "Tool Call",
    category: "AI and agents",
    description: "Which tool an agent ran, with what and what came back; tools that act outside wait for approval.",
    examples: [{ title: "Tool Call", file: "tool-call/demo", component: ToolCallDemo }],
    usage: `import { ToolCall } from "@/components/ui/tool-call";

<ToolCall name="crm.lookup" status="done" args={call.args} result={call.result} />`,
    props: [
      { name: "name / status", type: 'string / "running" | "done" | "error" | "awaiting-approval"', description: "What ran and where it is." },
      { name: "args / result", type: "unknown", description: "Shown as JSON text after redaction." },
      { name: "external + approval", type: "boolean + { requester; onApprove; onRequestChanges }", description: "A tool that acts outside waits in an ApprovalCard while awaiting approval." },
      { name: "redactKeys", type: "string[]", description: "Replaces the default keys: password, secret, token, authorization, api key, cookie, session, credential…" },
      { name: "Reasoning", type: "component", description: "children (markdown), streaming, durationMs; starts collapsed, same redaction." },
      { name: "redact(value) / redactText(text)", type: "lib", description: "The same redaction for your own views and logs." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "Secrets are redacted before anything is shown",
          text: "Values under secret-looking keys, bearer tokens, JWTs and key=value secrets are replaced; sizes and depth are bounded.",
          evidence: [["tool-call.test.tsx", "never lets a secret under a secret key through (property)"], ["tool-call.test.tsx", "finds secrets inside text: bearer tokens, JWTs and key=value pairs (property)"]],
          ids: ["CWE-200", "OWASP LLM02:2025"],
        },
        {
          title: "Arguments and results are text",
          text: "Shown as escaped JSON, never as markup.",
          evidence: [["tool-call.test.tsx", "shows name, status and redacted arguments and result as text"]],
          ids: ["CWE-79", "OWASP LLM05:2025"],
        },
        {
          title: "External tools wait for a person",
          text: "A tool that acts outside waits in an ApprovalCard, which confirms through an AlertDialog that starts on Cancel.",
          evidence: [["tool-call.test.tsx", "sends an external tool through an ApprovalCard while it waits"]],
          ids: ["OWASP LLM06:2025"],
        },
      ],
      backend: "hold the tool call until the approval arrives; the card only shows that it waits.",
    },
    accessibility: {
      keyboard: [["Enter / Space", "Opens and closes the arguments and result."]],
      notes: ["The status is text, not only color; a call waiting on a person shows a status message and an ApprovalCard."],
      motion: "Details open on a spring; the Reasoning label pulses while the agent thinks. With reduced motion both are still.",
    },
  },
  {
    name: "code-block",
    title: "Code Block",
    category: "Data display",
    description: "Code with token highlighting, a copy button and an optional line-by-line reveal for quickstarts.",
    examples: [{ title: "Code Block", file: "code-block/demo", component: CodeBlockDemo }],
    usage: `import { CodeBlock } from "@/components/ui/code-block";

<CodeBlock lang="bash" code="npx @aedis/cli@0.5.2 add button" />`,
    props: [
      { name: "code", type: "string", description: "The code, rendered as text. Copy copies exactly this." },
      { name: "lang", type: "string", default: '"text"', description: "Any language shiki bundles; unknown ones are plain text." },
      { name: "title", type: "string", description: "Shown above the code, e.g. a file name." },
      { name: "animated", type: "boolean", default: "false", description: "Reveal lines one by one when scrolled into view, once. Off under reduced motion." },
      { name: "lineDelay", type: "number", default: "120", description: "Milliseconds between lines when animated." },
      { name: "labels", type: "Partial<CodeBlockLabels>", description: "copy, copied, copyFailed, hidden." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "Hidden characters are shown",
          text: "Bidi controls and zero-width characters appear as U+XXXX markers instead of running unseen (Trojan Source).",
          evidence: [["code-block.test.tsx", "shows bidi controls and zero-width characters as visible markers (Trojan Source)"], ["code-block.test.tsx", "never renders an invisible code point and never loses visible text (property)"]],
          ids: ["CVE-2021-42574", "CWE-451"],
        },
        {
          title: "Highlighting is text",
          text: "shiki tokens render as React text with theme variables, never codeToHtml.",
          evidence: [["code-block.test.tsx", "highlights with theme variables only and keeps text as text"]],
          ids: ["CWE-79"],
        },
        {
          title: "Copy copies exactly what was given",
          text: "Only on a click, as plain text, without the markers.",
          evidence: [["code-block.test.tsx", "copies exactly the original code on click and announces it"]],
          ids: ["CWE-451"],
        },
      ],
      notes: ["Uses shiki's JavaScript regex engine: no WebAssembly, so a CSP without 'wasm-unsafe-eval' keeps working."],
    },
    accessibility: {
      keyboard: [["Tab", "Reaches the copy button."]],
      notes: ["The copy button is named \"Copy code\" and announces \"Copied\" or a failure.", "Hidden bidi and zero-width characters show as visible markers with their code point."],
      motion: "With animated, lines appear one by one when the block scrolls into view. With reduced motion they all appear at once.",
    },
  },
  {
    name: "navigation-menu",
    title: "Navigation Menu",
    category: "Navigation",
    description: "Top navigation for a public site, with panels of grouped links.",
    examples: [{ title: "Navigation Menu", file: "navigation-menu/demo", component: NavigationMenuDemo }],
    usage: `import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";

<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuLink href="/docs">Docs</NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`,
    props: [
      { name: "NavigationMenuLink href", type: "string", description: "Goes through safeUrl; a refused URL renders as text. External links get rel=\"noopener noreferrer\" and a marker." },
      { name: "NavigationMenuItem active", type: "boolean", description: "The current section; the indicator rests under it when no panel is open." },
      { name: "align", type: '"start" | "center" | "end"', default: '"start"', description: "Panel alignment under the trigger." },
      { name: "labels", type: "Partial<NavigationMenuLabels>", description: "label: accessible name of the landmark." },
      ...baseProps("@base-ui/react NavigationMenu"),
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "Links are safe by construction",
          text: "Every href goes through safeUrl: javascript:, data: and vbscript: never become links; external links get noopener noreferrer and a visible marker.",
          evidence: [["navigation-menu.test.tsx", "opens from the keyboard, keeps links safe and closes with Escape back on the trigger"], ["navigation-menu.test.tsx", "marks external links and isolates them"]],
          ids: ["CWE-79", "CWE-601", "CWE-1022", "OWASP A03:2021"],
        },
      ],
    },
    accessibility: {
      keyboard: [["Tab", "Moves between top-level items."], ["Enter / Space / ↓", "Opens a trigger's panel and moves into it."], ["Esc", "Closes the panel and returns focus to its trigger."]],
      notes: ["A nav landmark named \"Site navigation\" by default; triggers have aria-expanded."],
      motion: "An indicator slides under the active item on a spring; panels materialize and their content slides in. The chevron turns in 200 ms. With reduced motion they only fade.",
    },
  },
  {
    name: "sheet",
    title: "Sheet",
    category: "Overlays",
    description: "A panel from the edge of the screen for navigation on phones, details and filters. Swipe it away.",
    examples: [{ title: "Sheet", file: "sheet/demo", component: SheetDemo }],
    usage: `import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

<Sheet side="right">
  <SheetTrigger render={<Button variant="outline" />}>Details</SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Approval pending</SheetTitle>
      <SheetDescription>The agent wants to send the report.</SheetDescription>
    </SheetHeader>
  </SheetContent>
</Sheet>`,
    props: [
      { name: "Sheet side", type: '"right" | "left" | "bottom" | "top"', default: '"right"', description: "Edge it comes from; also the direction that swipes it away." },
      { name: "SheetContent showCloseButton", type: "boolean", default: "true", description: "The labelled close button in the corner." },
      { name: "SheetContent labels", type: "Partial<SheetLabels>", description: "close: the close button's accessible name." },
      { name: "SheetProvider / SheetIndent / SheetIndentBackground", type: "components", description: "Optional: wrap the app so the page recedes behind any open sheet." },
      ...baseProps("@base-ui/react Drawer"),
    ],
    security: { sinks: [], notes: [
      "Modal: focus is trapped while open and returns to the trigger on close; the page behind is inert; Escape closes.",
      "Title and description are wired to aria-labelledby and aria-describedby.",
    ] },
    accessibility: {
      keyboard: [["Tab / Shift+Tab", "Moves focus inside the sheet only."], ["Esc", "Closes it and returns focus to the trigger."]],
      notes: ["A modal dialog named by SheetTitle; the close button is labelled (\"Close\" by default).", "Swiping toward its edge closes it, as on a phone."],
      motion: "It slides in from its side on the 700 ms sheet spring and follows the finger while swiped; the release keeps the swipe's speed. Content arrives in parallax and the scrim dims with how open it is. With reduced motion it only fades.",
    },
  },
  {
    name: "dropdown-menu",
    title: "Dropdown Menu",
    category: "Overlays",
    description: "A menu of actions: account menu, row actions, a more button.",
    examples: [
      { title: "Session actions", file: "dropdown-menu/demo", component: DropdownMenuDemo },
      { title: "Checkbox and radio items", description: "Options that stay in the menu: a toggle and a choice of one.", file: "dropdown-menu/checkbox-radio", component: DropdownMenuCheckboxRadio },
      { title: "Submenu, shortcut and disabled items", description: "A refused link is disabled rather than removed, so the menu keeps its shape.", file: "dropdown-menu/submenu-disabled", component: DropdownMenuSubmenu },
    ],
    usage: `import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger render={<Button variant="outline" />}>Agent</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={rename}>Rename</DropdownMenuItem>
    <DropdownMenuItem variant="destructive" confirm={{ title: "Delete this agent?" }} onClick={remove}>
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
    props: [
      { name: "labels", type: "Partial<DropdownMenuLabels>", description: "confirmTitle, confirmDescription, confirm, cancel. The rest comes from the Locale provider." },
      ...baseProps("@base-ui/react Menu.Root (open, onOpenChange, modal…)"),
    ],
    parts: [
      { name: "DropdownMenuTrigger", props: baseProps("@base-ui/react Menu.Trigger") },
      {
        name: "DropdownMenuContent",
        props: [
          { name: "side", type: '"top" | "bottom" | "left" | "right"', default: '"bottom"', description: "Where the menu opens." },
          { name: "align", type: '"start" | "center" | "end"', default: '"start"', description: "Alignment with the trigger." },
          { name: "sideOffset / alignOffset", type: "number", default: "6 / 0", description: "Distance from the trigger, in pixels." },
        ],
      },
      {
        name: "DropdownMenuItem",
        props: [
          { name: "variant", type: '"default" | "destructive"', default: '"default"', description: "A destructive item opens an AlertDialog that starts on Cancel; onClick runs only after confirming." },
          { name: "confirm", type: "{ title?; description?; action? }", description: "Text of that confirmation; the dictionary fills the rest, the action defaults to the item text." },
          { name: "inset", type: "boolean", default: "false", description: "Indents the text to line up with items that have an indicator." },
          ...baseProps("@base-ui/react Menu.Item (disabled, closeOnClick…)"),
        ],
      },
      {
        name: "DropdownMenuLinkItem",
        props: [
          { name: "href", type: "string", description: "Goes through safeUrl; a refused URL leaves the item disabled. External links get noopener noreferrer and a marker." },
          { name: "labels", type: "Partial<LinkLabels>", description: "The external marker's text for screen readers." },
        ],
      },
      { name: "DropdownMenuCheckboxItem", props: baseProps("@base-ui/react Menu.CheckboxItem (checked, onCheckedChange)") },
      { name: "DropdownMenuRadioGroup / DropdownMenuRadioItem", props: baseProps("@base-ui/react Menu.RadioGroup (value, onValueChange) and Menu.RadioItem (value)") },
      { name: "DropdownMenuSub / SubTrigger / SubContent", description: "A nested menu; SubContent opens to the right (start in RTL).", props: baseProps("@base-ui/react Menu.SubmenuRoot and Menu.SubmenuTrigger") },
      { name: "DropdownMenuLabel, Separator, Group, Shortcut", description: "Structure: a heading that works anywhere in the menu, a hairline, a group and a key hint shown at the end of an item.", props: [] },
      { name: "DropdownMenuGroupLabel", description: "The heading of a Group or RadioGroup, which it also names for screen readers. Only inside one of them.", props: [] },
    ],
    accessibility: {
      keyboard: [
        ["Enter / Space / ↓", "Opens the menu from the trigger and focuses the first item."],
        ["↑ ↓", "Moves between items; Home and End go to the first and last."],
        ["→ / ←", "Opens and closes a submenu."],
        ["A–Z", "Moves to the next item that starts with that letter."],
        ["Esc", "Closes the menu and returns focus to the trigger."],
      ],
      notes: [
        "The trigger has aria-haspopup and aria-expanded; the popup is a menu of menuitem, menuitemcheckbox and menuitemradio.",
        "The external marker on a link item is announced, so a reader knows the link leaves the site.",
        "After a destructive confirmation, focus returns to the trigger, not to the page body.",
      ],
      motion: "The menu materializes from its trigger on a critically damped spring and its items arrive in a 50 ms cascade; it closes in 200 ms with no cascade. With reduced motion it only fades.",
    },
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "Destructive actions need a confirmation that starts on Cancel",
          text: "The item opens an AlertDialog before onClick runs, and the dialog focuses Cancel first, so Enter backs out.",
          evidence: [["dropdown-menu.test.tsx", "asks before a destructive action, starting on Cancel, and runs it only on confirm"]],
          ids: ["OWASP LLM06:2025"],
        },
        {
          title: "Links are safe by construction",
          text: "Every href goes through safeUrl: javascript:, data: and vbscript: never become links; external links get noopener noreferrer and a visible marker.",
          evidence: [["dropdown-menu.test.tsx", "keeps link items safe and marks external ones"]],
          ids: ["CWE-79", "CWE-601", "CWE-1022", "OWASP A03:2021"],
        },
      ],
      backend: "authorize the action on the server; the confirmation only protects people from a slip, never from an attacker.",
    },
  },
  {
    name: "accordion",
    title: "Accordion",
    category: "Data display",
    description: "FAQ and docs sections that expand.",
    examples: [{ title: "Accordion", file: "accordion/demo", component: AccordionDemo, align: "start" }],
    usage: `import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

<Accordion>
  <AccordionItem value="who">
    <AccordionTrigger>Who approves what the agent sends?</AccordionTrigger>
    <AccordionContent>A person on the team.</AccordionContent>
  </AccordionItem>
</Accordion>`,
    props: [
      { name: "multiple", type: "boolean", default: "false", description: "Allow several items open at once." },
      { name: "hiddenUntilFound", type: "boolean", default: "true", description: "Collapsed content stays in the DOM and opens when the browser's in-page search finds it." },
      ...baseProps("@base-ui/react Accordion"),
    ],
    security: { sinks: [], notes: ["Content is rendered as data; collapsed content stays in the DOM, so nothing is fetched or injected on open."] },
    accessibility: {
      keyboard: [["Enter / Space", "Opens and closes an item."], ["↑ ↓", "Moves between triggers; Home and End go to the first and last."]],
      notes: ["Triggers are buttons inside headings with aria-expanded; closed panels are hidden until found, so find-in-page still reaches their text."],
      motion: "Panels open on a critically damped spring and close in 200 ms; the chevron turns with them. With reduced motion they open at once.",
    },
  },
  {
    name: "collapsible",
    title: "Collapsible",
    category: "Data display",
    description: "Shows and hides one area.",
    examples: [{ title: "Collapsible", file: "collapsible/demo", component: CollapsibleDemo, align: "start" }],
    usage: `import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

<Collapsible>
  <CollapsibleTrigger render={<Button variant="ghost" />}>Show details</CollapsibleTrigger>
  <CollapsibleContent>…</CollapsibleContent>
</Collapsible>`,
    props: [
      { name: "CollapsibleContent hiddenUntilFound", type: "boolean", default: "true", description: "Findable with in-page search while collapsed." },
      ...baseProps("@base-ui/react Collapsible"),
    ],
    security: { sinks: [], notes: ["Content is rendered as data."] },
    accessibility: {
      keyboard: [["Enter / Space", "Opens and closes the panel."]],
      notes: ["The trigger has aria-expanded and aria-controls; a closed panel is hidden until found by find-in-page."],
      motion: "The panel opens on a critically damped spring and closes in 200 ms. With reduced motion it opens at once.",
    },
  },
  {
    name: "alert",
    title: "Alert",
    category: "Feedback",
    description: "A callout for status, success, warnings and errors.",
    examples: [{ title: "Alert", file: "alert/demo", component: AlertDemo }],
    usage: `import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

<Alert variant="destructive">
  <AlertTitle>Could not send the proposal</AlertTitle>
  <AlertDescription>Nothing was sent. Try again in a minute.</AlertDescription>
</Alert>`,
    props: [
      { name: "variant", type: '"default" | "success" | "warning" | "destructive"', default: '"default"', description: "Only destructive uses role=\"alert\"; the rest are role=\"status\"." },
      { name: "role", type: "string", description: "Override when the default announcement is wrong for the context." },
    ],
    security: { sinks: [], notes: [
      "Text only: no prop takes markup.",
      "Write the message yourself; never show the server's error text as is (it can disclose internals).",
    ] },
    accessibility: {
      notes: ["Only the destructive variant is role=\"alert\" and interrupts; the others are role=\"status\" and announced politely.", "Color is never the only cue: give every alert a title."],
    },
  },
  {
    name: "empty",
    title: "Empty",
    category: "Feedback",
    description: "The state of a page or list with nothing in it yet, and what to do next.",
    examples: [{ title: "Empty", file: "empty/demo", component: EmptyDemo }],
    usage: `import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

<Empty>
  <EmptyHeader>
    <EmptyTitle>No agents yet</EmptyTitle>
    <EmptyDescription>Hire one to start.</EmptyDescription>
  </EmptyHeader>
</Empty>`,
    props: [{ name: "EmptyMedia variant", type: '"default" | "icon"', default: '"default"', description: "Decorative, hidden from assistive technology." }],
    security: { sinks: [], notes: ["Text only."] },
    accessibility: {
      notes: ["Plain content: the title and description are read in order; the media is decorative and hidden."],
    },
  },
  {
    name: "spinner",
    title: "Spinner",
    category: "Feedback",
    description: "Loading indicator.",
    examples: [{ title: "Spinner", file: "spinner/demo", component: SpinnerDemo }],
    usage: `import { Spinner } from "@/components/ui/spinner";

<Spinner />`,
    props: [
      { name: "labels", type: "Partial<SpinnerLabels>", description: "label: what is loading, announced politely." },
      { name: "...props", type: "span props", description: "Every prop of the wrapping span (role=\"status\")." },
    ],
    security: { sinks: [], notes: ["With reduced motion it stops rotating and shows its label as text."] },
    accessibility: {
      notes: ["role=\"status\" with the label \"Loading\" from the Locale provider, announced politely."],
      motion: "It rotates. With reduced motion it stops and shows its label as text instead.",
    },
  },
  {
    name: "kbd",
    title: "Kbd",
    category: "Data display",
    description: "A key or a key combination.",
    examples: [{ title: "Kbd", file: "kbd/demo", component: KbdDemo }],
    usage: `import { Kbd, KbdGroup } from "@/components/ui/kbd";

<KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>`,
    props: [{ name: "KbdGroup", type: "kbd", description: "A combination: nested kbd elements, as HTML specifies." }],
    security: { sinks: [], notes: ["Text only."] },
    accessibility: {
      notes: ["Native kbd elements, nested for a combination as HTML specifies."],
    },
  },
  {
    name: "site-header",
    title: "Site Header",
    category: "Navigation",
    description: "The sticky top bar of a site: brand, navigation and actions. Below md the items and actions move into a sheet.",
    examples: [{ title: "Site Header", file: "site-header/demo", component: SiteHeaderDemo }],
    usage: `import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/ui/site-header";

<SiteHeader brand="Acme" items={[{ label: "Docs", href: "/docs", active: true }]} actions={<Button>Sign in</Button>} />`,
    props: [
      { name: "brand", type: "ReactNode", description: "Logo or name, wrapped in a link to homeHref. A text brand names the link; a logo-only brand is named by labels.home." },
      { name: "homeHref", type: "string", default: '"/"', description: "Where the brand links; goes through safeUrl." },
      { name: "items", type: "{ label: string; href: string; active?: boolean }[]", description: "The navigation. active marks the current section (indicator and aria-current)." },
      { name: "actions", type: "ReactNode", description: "Right side from md up (e.g. a GitHub link and a primary Button); inside the sheet below md." },
      { name: "labels", type: "Partial<SiteHeaderLabels>", description: "home: name of a logo-only brand link; menu: the menu button and sheet title." },
      { name: "className", type: "string", description: "Classes for the header element." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "Links are safe by construction",
          text: "Every href goes through safeUrl: javascript:, data: and vbscript: never become links; external links get noopener noreferrer and a visible marker.",
          evidence: [["site-chrome.test.tsx", "keeps hrefs safe, isolates external items and marks the current one"]],
          ids: ["CWE-79", "CWE-601", "CWE-1022", "OWASP A03:2021"],
        },
      ],
    },
    accessibility: {
      keyboard: [["Tab", "Moves through the brand, the links and the actions."], ["Esc", "Closes the menu sheet on small screens."]],
      notes: ["A banner landmark; a text brand names its link by the text it shows (WCAG 2.5.3), a logo-only brand by the Locale provider (\"Home\"); the current item has aria-current=\"page\".", "On small screens the items move into a sheet behind a labelled menu button."],
      motion: "The header is a translucent material that fades the content scrolling under it. With reduced transparency it is solid.",
    },
  },
  {
    name: "site-footer",
    title: "Site Footer",
    category: "Navigation",
    description: "The bottom of a site: links and notes such as the license.",
    examples: [{ title: "Site Footer", file: "site-footer/demo", component: SiteFooterDemo }],
    usage: `import { SiteFooter } from "@/components/ui/site-footer";

<SiteFooter links={[{ label: "Privacy", href: "/privacy" }]}>© Acme</SiteFooter>`,
    props: [
      { name: "links", type: "{ label: string; href: string }[]", description: "Rendered with Link: safe protocols only, external marker and noopener." },
      { name: "children", type: "ReactNode", description: "Notes, e.g. the license line." },
      { name: "labels", type: "Partial<SiteFooterLabels>", description: "label: accessible name of the footer navigation." },
      { name: "className", type: "string", description: "Classes for the footer element." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "Links are safe by construction",
          text: "Every href goes through safeUrl: javascript:, data: and vbscript: never become links; external links get noopener noreferrer and a visible marker.",
          evidence: [["site-chrome.test.tsx", "renders safe links in a labelled navigation with the notes"]],
          ids: ["CWE-79", "CWE-601", "CWE-1022", "OWASP A03:2021"],
        },
      ],
    },
    accessibility: {
      notes: ["A contentinfo landmark with its links in a nav named by the Locale provider; links go through safeUrl like every Aedis link."],
    },
  },
  {
    name: "breadcrumb",
    title: "Breadcrumb",
    category: "Navigation",
    description: "Where a page sits in the site.",
    examples: [{ title: "Breadcrumb", file: "breadcrumb/demo", component: BreadcrumbDemo }],
    usage: `import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>Approvals</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
    props: [
      { name: "BreadcrumbLink href", type: "string", description: "Goes through safeUrl; pass render={<Link />} for a router link." },
      { name: "BreadcrumbPage", type: "span", description: "The current page, with aria-current=\"page\"." },
      { name: "labels", type: "Partial<BreadcrumbLabels>", description: "label (landmark), more (ellipsis)." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "Links are safe by construction",
          text: "Every href goes through safeUrl: javascript:, data: and vbscript: never become links; external links get noopener noreferrer and a visible marker.",
          evidence: [["breadcrumb-pagination-item.test.tsx", "is a labelled trail with safe links and the current page marked"]],
          ids: ["CWE-79", "CWE-601", "CWE-1022", "OWASP A03:2021"],
        },
      ],
    },
    accessibility: {
      notes: ["A nav named \"Breadcrumb\" around an ordered list; the current page has aria-current=\"page\".", "Separators are hidden from screen readers; the ellipsis is announced as \"More\"."],
    },
  },
  {
    name: "pagination",
    title: "Pagination",
    category: "Navigation",
    description: "Previous, next and page links for paginated lists.",
    examples: [{ title: "Pagination", file: "pagination/demo", component: PaginationDemo }],
    usage: `import { paginationRange } from "@/lib/pagination";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink } from "@/components/ui/pagination";

<Pagination>
  <PaginationContent>
    {paginationRange(page, total).map((p, i) => (
      <PaginationItem key={i}>{p === "ellipsis" ? <PaginationEllipsis /> : <PaginationLink href={\`?page=\${p}\`} isActive={p === page}>{p}</PaginationLink>}</PaginationItem>
    ))}
  </PaginationContent>
</Pagination>`,
    props: [
      { name: "parsePage(value, total)", type: "number", description: "A page from the URL or a form, as an integer from 1 to total; anything else becomes 1." },
      { name: "paginationRange(page, total, siblings?)", type: '(number | "ellipsis")[]', description: "Pages to render around the current one." },
      { name: "PaginationLink isActive", type: "boolean", description: "The current page (aria-current=\"page\")." },
      { name: "labels", type: "Partial<PaginationLabels>", description: "label, previous, next, goPrevious, goNext, more." },
    ],
    security: {
      sinks: ["DOM", "Input"],
      defenses: [
        {
          title: "Page numbers from the URL are untrusted",
          text: "parsePage keeps integers within bounds and caps the total, so a forged page cannot explode the list.",
          evidence: [["breadcrumb-pagination-item.test.tsx", "reads page numbers as integers within bounds"], ["breadcrumb-pagination-item.test.tsx", "always returns an integer in [1, total] (property)"]],
          ids: ["CWE-20", "CWE-1284"],
        },
        {
          title: "Links are safe by construction",
          text: "Every href goes through safeUrl: javascript:, data: and vbscript: never become links; external links get noopener noreferrer and a visible marker.",
          evidence: [["breadcrumb-pagination-item.test.tsx", "labels previous and next, marks the current page and refuses unsafe links"]],
          ids: ["CWE-79", "CWE-601", "CWE-1022", "OWASP A03:2021"],
        },
      ],
    },
    accessibility: {
      keyboard: [["Tab", "Moves through the page links."]],
      notes: ["A nav named \"Pagination\"; the current page has aria-current=\"page\"; Previous and Next have full names (\"Go to previous page\").", "A link with no target page is aria-disabled and not focusable."],
    },
  },
  {
    name: "item",
    title: "Item",
    category: "Data display",
    description: "A row in a list: media, content and actions.",
    examples: [{ title: "Item", file: "item/demo", component: ItemDemo }],
    usage: `import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";

<Item variant="outline">
  <ItemContent>
    <ItemTitle>Sales agent</ItemTitle>
    <ItemDescription>3 proposals waiting</ItemDescription>
  </ItemContent>
</Item>`,
    props: [
      { name: "href", type: "string", description: "Makes the row a link, through safeUrl. Inside an ItemGroup it is wrapped in a listitem and keeps its link role." },
      { name: "variant", type: '"default" | "outline" | "muted"', default: '"default"', description: "Surface." },
      { name: "size", type: '"default" | "sm"', default: '"default"', description: "Padding." },
      { name: "render", type: "ReactElement", description: "Another element to render, e.g. a router link." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "Links are safe by construction",
          text: "Every href goes through safeUrl: javascript:, data: and vbscript: never become links; external links get noopener noreferrer and a visible marker.",
          evidence: [["breadcrumb-pagination-item.test.tsx", "is a listitem in a group, and a safe link when it has an href"]],
          ids: ["CWE-79", "CWE-601", "CWE-1022", "OWASP A03:2021"],
        },
      ],
    },
    accessibility: {
      keyboard: [["Enter", "Follows an item with href."]],
      notes: ["ItemGroup is a list; linked items are wrapped as list items so the list stays valid.", "An item with href goes through safeUrl and becomes a link."],
    },
  },
  {
    name: "scroll-area",
    title: "Scroll Area",
    category: "Data display",
    description: "A scrollable region with consistent scrollbars, for code, side panels and long lists.",
    examples: [{ title: "Scroll Area", file: "scroll-area/demo", component: ScrollAreaDemo }],
    usage: `import { ScrollArea } from "@/components/ui/scroll-area";

<ScrollArea className="h-48" aria-label="Activity">
  {entries}
</ScrollArea>`,
    props: [
      { name: "aria-label", type: "string", description: "Names the region; the viewport is focusable when it overflows so the keyboard can scroll it." },
      ...baseProps("@base-ui/react ScrollArea"),
    ],
    security: { sinks: [], notes: ["Scrolling stays native: wheel, touch, keyboard and in-page search work as usual.", "Base UI hides the native scrollbar with an inline <style> element: under a nonce CSP pass the nonce prop; a static site gives securityHeaders its hash (styleHashes)."] },
    accessibility: {
      keyboard: [["↑ ↓ / Page Up / Page Down", "Scrolls when the area has focus."]],
      notes: ["With aria-label it becomes a named region, so keyboard users can find and scroll it."],
      motion: "Scrollbars fade in while hovering or scrolling. With reduced motion they are always visible.",
    },
  },
  {
    name: "button-group",
    title: "Button Group",
    category: "Actions",
    description: "Buttons that belong together: toolbars and segmented actions.",
    examples: [
      { title: "Button Group", file: "button-group/demo", component: ButtonGroupDemo },
      { title: "Vertical and with text", file: "button-group/vertical-text", component: ButtonGroupVerticalText },
    ],
    usage: `import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

<ButtonGroup aria-label="Message actions">
  <Button variant="outline">Reply</Button>
  <Button variant="outline">Forward</Button>
</ButtonGroup>`,
    props: [
      { name: "aria-label | aria-labelledby", type: "string", description: "Required: the group's name." },
      { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Direction; joined edges lose their inner radius." },
      { name: "ButtonGroupText / ButtonGroupSeparator", type: "components", description: "A text cell (e.g. a URL prefix) and a divider." },
    ],
    security: { sinks: [], notes: ["role=\"group\" with a name; each button keeps its own semantics and tab stop."] },
    accessibility: {
      keyboard: [["Tab", "Moves to each button in turn: every button keeps its own tab stop."]],
      notes: ["The group is role=\"group\" and its name is required by the type, so a reader hears what the buttons are for."],
    },
  },
  {
    name: "toast",
    title: "Toast",
    category: "Feedback",
    description: "Feedback after an action: Copied, Saved, Request failed.",
    examples: [{ title: "Toast", file: "toast/demo", component: ToastDemo }],
    usage: `import { Toaster, toast } from "@/components/ui/toast";

// Once, near the root of the app:
<Toaster />

toast.success("Saved");`,
    props: [
      { name: "<Toaster />", type: "component", description: "Once near the root; renders the stack in the bottom corner. labels: region, close, failed." },
      { name: "toast.show / success / info / warning / error(title, options?)", type: "string id", description: "Text only. Errors are announced urgently (role=\"alert\"); the rest politely." },
      { name: "useToast().failed(options?)", type: "string id", description: "The generic failure message in the reader's language, for catch blocks." },
      { name: "options", type: "{ description?; timeout?; action?: { label; onClick } }", description: "Timeout in ms (0 keeps it); paused while hovered or focused." },
      { name: "toast.dismiss(id)", type: "void", description: "Close one toast." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "Text, never markup",
          text: "Title and description are strings, hidden characters removed.",
          evidence: [["toast.test.tsx", "shows text, never markup, and strips hidden characters"]],
          ids: ["CWE-79", "ATLAS AML.T0051.001"],
        },
        {
          title: "Never the server's error text",
          text: "Failures show a message you wrote or the generic one from the dictionary.",
          evidence: [["toast.test.tsx", "uses the generic dictionary message for failures, never the server's text"]],
          ids: ["CWE-209"],
        },
      ],
      notes: ["Timers pause while the stack is hovered or focused, so nobody has to race a message."],
    },
    accessibility: {
      keyboard: [["F6", "Moves focus to the toast region (Base UI's landmark shortcut)."], ["Esc", "Dismisses the focused toast."]],
      notes: ["Errors are announced assertively, like role=\"alert\"; everything else politely.", "The region and the close button are named by the Locale provider; timers pause while a toast is hovered or focused."],
      motion: "Toasts stack with a peek of the ones behind, slide in from the bottom and can be swiped away. With reduced motion they only fade.",
    },
  },
  {
    name: "link",
    title: "Link",
    category: "Actions",
    description: "An anchor for URLs that come from content or configuration.",
    examples: [{ title: "Link", file: "link/demo", component: LinkDemo }],
    usage: `import { Link } from "@/components/ui/link";

<Link href={source.url}>{source.title}</Link>`,
    props: [
      { name: "href", type: "string", description: "Any URL; only http, https, mailto and relative ones become links." },
      { name: "linkProps(href)", type: "{ href | null; external; rel }", description: "The same rules for components that render their own anchor." },
      { name: "labels", type: "Partial<LinkLabels>", description: "external: the screen-reader text after external links." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "Only safe protocols become links",
          text: "http, https, mailto and relative URLs; anything else renders its text without a link.",
          evidence: [["navigation-menu.test.tsx", "never yields a link with a dangerous protocol (property)"], ["navigation-menu.test.tsx", "renders the text without a link when the URL is refused, and marks external links"]],
          ids: ["CWE-79", "CWE-601"],
        },
        {
          title: "External sites are isolated",
          text: "noopener noreferrer, so the other site gets neither window.opener nor this page's address.",
          evidence: [["navigation-menu.test.tsx", "keeps safe URLs, refuses dangerous ones and isolates external sites"]],
          ids: ["CWE-1022"],
        },
      ],
    },
    accessibility: {
      keyboard: [["Enter", "Follows the link."]],
      notes: ["External links end with an arrow and screen-reader text (\"(external site)\" by default), so people know before following them.", "A refused URL renders plain text, never a link that goes nowhere."],
    },
  },
  {
    name: "use-reduced-motion",
    title: "useReducedMotion",
    category: "Foundations",
    description: "True when the person asked for less motion. For motion driven by JavaScript; CSS motion already reads the theme tokens.",
    examples: [{ title: "Live setting", description: "Follows the system setting as it changes.", file: "use-reduced-motion/demo", component: UseReducedMotionDemo }],
    usage: `import { useReducedMotion } from "@/hooks/use-reduced-motion";

const reduced = useReducedMotion();`,
    props: [{ name: "returns", type: "boolean", description: "Follows prefers-reduced-motion live; false on the server." }],
    security: { sinks: [], notes: ["No side effects; reads a media query."] },
  },
  {
    name: "use-event-stream",
    title: "useEventStream",
    category: "Transport",
    description: "Hook that subscribes to a Server-Sent Events endpoint of this origin, e.g. the messages of a conversation as an agent writes them.",
    examples: [{ title: "Simulated stream", description: "The switch enables the hook; turning it off closes the stream.", file: "use-event-stream/simulator", component: UseEventStreamSimulator }],
    usage: `import { useEventStream } from "@/hooks/use-event-stream";

const state = useEventStream<Message>("/api/conversations/42/events", {
  events: ["message", "done"],
  onEvent: (message, { type }) => setMessages((m) => [...m, message]),
});`,
    props: [
      { name: "path", type: "string | null", description: "Same-origin path; null pauses. A token in the query string is refused." },
      { name: "onEvent", type: "(data, { type, id }) => void", description: "Called with the parsed JSON of each allowed event; malformed JSON is ignored." },
      { name: "events", type: "string[]", default: '["message"]', description: "Allow-list of event types." },
      { name: "enabled", type: "boolean", default: "true", description: "Pause without changing the path." },
      { name: "lastEventId", type: "string", description: "Resume after this id (Last-Event-ID, 256 printable characters at most)." },
      { name: "maxEventBytes / maxConnectionBytes", type: "number", default: "64 KiB / 16 MiB", description: "Bigger events are dropped; past the connection limit it reconnects from the last id." },
      { name: "heartbeatMs / maxRetries / retryMs / maxRetryMs", type: "number", default: "15000 / 8 / 1000 / 30000", description: "Silence for 2x heartbeat reconnects; backoff with jitter honours the server's retry:." },
      { name: "returns", type: '"connecting" | "open" | "retrying" | "closed" | "error"', description: "Connection state." },
    ],
    security: {
      sinks: ["Transport", "DOM"],
      defenses: [
        {
          title: "Same-origin, with no token in the URL",
          text: "fetch with a streamed body, not EventSource: same-origin paths only, redirects refused, X-Requested-With sent, and a path with a token in its query throws.",
          evidence: [["event-stream.test.tsx", "accepts same-origin paths and refuses other hosts and tokens in the query"], ["event-stream.test.tsx", "sends the api() rules, filters event types and ignores malformed JSON"]],
          ids: ["CWE-598", "CWE-352", "OWASP A07:2021"],
        },
        {
          title: "A bounded parser",
          text: "Limits per event and per connection, event types from an allow-list, malformed JSON ignored, bad ids and retry values dropped.",
          evidence: [["event-stream.test.tsx", "drops events past the size limit, including a line that never ends (property)"], ["event-stream.test.tsx", "ignores ids that are too long or not printable, and bad retry values"]],
          ids: ["CWE-400", "CWE-770"],
        },
        {
          title: "Hidden text never arrives",
          text: "stripInvisible runs on each assembled event, so a chunk boundary inside a surrogate pair cannot smuggle Unicode tags.",
          evidence: [["event-stream.test.tsx", "strips hidden code points from the assembled event even when a byte chunk splits a surrogate pair (property)"]],
          ids: ["ATLAS AML.T0051.001", "OWASP LLM01:2025"],
        },
        {
          title: "Retries that stop",
          text: "204 stops for good, other 4xx stop with an error, 5xx and network errors retry with capped backoff.",
          evidence: [["event-stream.test.tsx", "stops on 204 and on client errors, retries server errors and gives up after maxRetries"]],
          ids: ["CWE-400"],
        },
      ],
      backend: "Authenticate the stream with the session cookie (or bff-stream) and authorize every event a person receives.",
    },
  },
  {
    name: "event-stream",
    title: "event-stream",
    category: "Transport",
    description: "The library under useEventStream: an incremental SSE parser and a fetch-based connection with resume and backoff, for code outside React.",
    examples: [{ title: "Simulated stream", description: "connectEventStream against a stream simulated in the page.", file: "event-stream/simulator", component: EventStreamSimulator }],
    usage: `import { connectEventStream } from "@/lib/event-stream";

const { close } = connectEventStream<Progress>("/api/tasks/7/events", {
  events: ["progress"],
  onEvent: (p) => render(p),
  onState: (s) => setStatus(s),
});`,
    props: [
      { name: "connectEventStream(path, options)", type: "{ close }", description: "Same options as useEventStream plus signal and onState." },
      { name: "createSseParser({ onEvent, onRetry?, maxEventBytes? })", type: "{ push(text), end() }", description: "Feed decoded text; chunking never changes the events." },
      { name: "assertStreamPath(path)", type: "void", description: "Throws for another origin or a token in the query string." },
    ],
    security: {
      sinks: ["Transport", "DOM"],
      defenses: [
        {
          title: "Same-origin, with no token in the URL",
          text: "fetch with a streamed body, not EventSource: same-origin paths only, redirects refused, X-Requested-With sent, and a path with a token in its query throws.",
          evidence: [["event-stream.test.tsx", "accepts same-origin paths and refuses other hosts and tokens in the query"], ["event-stream.test.tsx", "sends the api() rules, filters event types and ignores malformed JSON"]],
          ids: ["CWE-598", "CWE-352", "OWASP A07:2021"],
        },
        {
          title: "A bounded parser",
          text: "Limits per event and per connection, event types from an allow-list, malformed JSON ignored, bad ids and retry values dropped.",
          evidence: [["event-stream.test.tsx", "drops events past the size limit, including a line that never ends (property)"], ["event-stream.test.tsx", "ignores ids that are too long or not printable, and bad retry values"]],
          ids: ["CWE-400", "CWE-770"],
        },
        {
          title: "Hidden text never arrives",
          text: "stripInvisible runs on each assembled event, so a chunk boundary inside a surrogate pair cannot smuggle Unicode tags.",
          evidence: [["event-stream.test.tsx", "strips hidden code points from the assembled event even when a byte chunk splits a surrogate pair (property)"]],
          ids: ["ATLAS AML.T0051.001", "OWASP LLM01:2025"],
        },
        {
          title: "Retries that stop",
          text: "204 stops for good, other 4xx stop with an error, 5xx and network errors retry with capped backoff.",
          evidence: [["event-stream.test.tsx", "stops on 204 and on client errors, retries server errors and gives up after maxRetries"]],
          ids: ["CWE-400"],
        },
      ],
      backend: "Authenticate the stream with the session cookie (or bff-stream) and authorize every event a person receives.",
    },
  },
  {
    name: "bff-stream",
    title: "bffStream",
    category: "Transport",
    description: "A Next.js route handler that relays the API's event stream with the session's bearer, so the token never reaches the browser.",
    examples: [{ title: "Simulated API", description: "The relay ran on the server when this page was built: the API gets the session's token, the browser never does.", file: "bff-stream/simulator", component: BffStreamSimulator }],
    usage: `import { bffStream } from "@/lib/bff-stream";

export const dynamic = "force-dynamic";

export const GET = bffStream({
  upstream: (req) => \`\${process.env.API_URL}/conversations/\${conversationId(req)}/events\`,
  getAccessToken: async () => (await auth())?.accessToken ?? null,
});`,
    props: [
      { name: "upstream", type: "string | URL | (request) => string | URL", description: "The API stream, from configuration; http(s) only. Never read a URL from the request." },
      { name: "getAccessToken", type: "(request) => string | null", description: "The bearer of the server-side session; null answers 401 without calling the API." },
      { name: "headers", type: "Record<string, string>", description: "Extra headers for the API; credentials, cookies and hop-by-hop headers throw." },
      { name: "log", type: "(message, details) => void", default: "console.error", description: "Where failure details go." },
      { name: "connectTimeoutMs", type: "number", default: "15000", description: "Wait for the API to start the stream." },
      { name: "fetcher", type: "typeof fetch", default: "fetch", description: "The fetch for the upstream request; tests and demos pass their own." },
    ],
    security: {
      sinks: ["Transport", "Session"],
      defenses: [
        {
          title: "The bearer never reaches the browser",
          text: "It comes from the server session; nothing from the browser goes upstream but a valid Last-Event-ID.",
          evidence: [["bff-stream.test.ts", "relays the stream with the session bearer and nothing from the browser but a valid Last-Event-ID"], ["bff-stream.test.ts", "refuses other methods and configured credential or hop-by-hop headers"]],
          ids: ["CWE-522", "OWASP A07:2021", "ATT&CK T1528"],
        },
        {
          title: "The upstream comes from configuration",
          text: "Never read from the request, and only http(s).",
          evidence: [["bff-stream.test.ts", "takes the upstream from configuration, which may depend on the request but is never read from it"], ["bff-stream.test.ts", "refuses an upstream that is not http(s) and a failing session lookup, without leaking why"]],
          ids: ["CWE-918", "OWASP A10:2021"],
        },
        {
          title: "Generic errors",
          text: "The browser gets a bare status; details go to the server log.",
          evidence: [["bff-stream.test.ts", "gives the browser a generic status and logs the details"]],
          ids: ["CWE-209"],
        },
        {
          title: "No stream outlives its reader",
          text: "The API request aborts when the browser disconnects and when the API does not start in time.",
          evidence: [["bff-stream.test.ts", "aborts the API request when the browser disconnects"], ["bff-stream.test.ts", "aborts when the API does not start the stream in time"]],
          ids: ["CWE-400"],
        },
      ],
      backend: "the API still authorizes the bearer for every event; revoke tokens there.",
    },
  },
  {
    name: "secure-action",
    title: "secureAction",
    category: "Transport",
    description: "A wrapper for Server Actions: required authorization, rate limit, size limit and schema inside the action, and a typed result without error messages.",
    examples: [{ title: "Simulated backend", description: "The action ran on the server when this page was built, once per case: what the caller got back.", file: "secure-action/simulator", component: SecureActionSimulator }],
    usage: `import { z } from "zod";
import { secureAction } from "@/lib/secure-action";

export const renameAgent = secureAction({
  authorize: currentUser,
  schema: z.object({ id: z.string().uuid(), name: z.string().max(80) }),
  handler: ({ id, name }, user) => db.agents.rename(user.tenantId, id, name),
});

const result = await renameAgent({ id, name }); // { ok: true, data } | { ok: false, code }`,
    props: [
      { name: "authorize", type: "() => Ctx | null", description: "Required; runs on every call. null answers \"unauthorized\"; throw ActionError(\"forbidden\") for a caller without the right." },
      { name: "schema", type: "StandardSchemaV1", description: "Any Standard Schema validator; the handler only sees its output. Invalid input returns the failing field paths." },
      { name: "maxInputBytes", type: "number", default: "65536", description: "Serialized size limit, files included, checked before validation." },
      { name: "rateLimit", type: "(ctx) => boolean", description: "Return false to answer \"rate-limited\"." },
      { name: "handler", type: "(input, ctx) => T", description: "Throw ActionError(\"not-found\" | \"conflict\" | …) for an expected failure." },
      { name: "taintSecret(message, lifetime, value)", type: "boolean", description: "React taint for a token (needs experimental.taint); false when unavailable." },
    ],
    security: {
      sinks: ["Transport"],
      defenses: [
        {
          title: "Authorization runs first, inside the action",
          text: "authorize is required and runs on every call; an anonymous call is never parsed.",
          evidence: [["secure-action.test.ts", "checks authorization first, so an anonymous call is never validated or run"], ["secure-action.test.ts", "refuses to build without authorize or a Standard Schema"]],
          ids: ["CWE-862", "OWASP A01:2021"],
        },
        {
          title: "Validated, bounded and rate-limited input",
          text: "Rate limit, size limit and Standard Schema run before the handler, which only sees the schema's output.",
          evidence: [["secure-action.test.ts", "answers with codes from ActionError, the rate limit, the size limit and the schema"]],
          ids: ["CWE-20", "CWE-770"],
        },
        {
          title: "A code, never an error message",
          text: "Whatever the handler throws, the client gets a code; details go to the server log.",
          evidence: [["secure-action.test.ts", "never returns the error message, whatever the handler throws (property)"]],
          ids: ["CWE-209"],
        },
      ],
      backend: "this is the backend: keep the checks in the action, and set allowedOrigins and bodySizeLimit (see the Server Actions guide).",
    },
  },
  {
    name: "mf-bridge",
    title: "mf-bridge",
    category: "Micro-frontends",
    description: "A typed, origin-checked postMessage channel between a host page and an embedded app.",
    examples: [{ title: "Live shell and remote", description: "Every message logged; a forged one is dropped and a hung request times out.", file: "mf-bridge/demo", component: MfBridgeDemo }],
    usage: `import { createBridge } from "@/lib/mf-bridge";

// Both sides declare what they accept.
const isHeight = (p: unknown): p is { height: number } => typeof (p as { height?: unknown })?.height === "number";

// Host
const bridge = createBridge({
  target: () => frame.current?.contentWindow ?? null,
  origins: [process.env.NEXT_PUBLIC_AGENT_ORIGIN!],
  messages: { resize: { validate: isHeight } },
});
bridge.on("resize", ({ height }) => setHeight(height));

// Embedded app
const parent = createBridge({ target: window.parent, origins: ["https://backoffice.example.com"], messages: {} });
await parent.ready;
parent.send("resize", { height: document.body.scrollHeight });`,
    props: [
      { name: "target", type: "Window | () => Window | null", description: "The other window: the iframe's contentWindow, or window.parent." },
      { name: "origins", type: "string[]", description: "Exact origins from configuration; malformed entries and wildcards are dropped." },
      { name: "messages", type: "Record<type, { validate; maxBytes?; allowSecrets? }>", description: "Allow-list of accepted types, each with its validator." },
      { name: "maxBytes / timeoutMs", type: "number", default: "65536 / 5000", description: "Size limit per message; timeout for requests." },
      { name: "returns", type: "{ ready; send; on; request; handle; peerOrigin; close }", description: "Handshake promise, events and request/response with correlation ids." },
    ],
    security: {
      sinks: ["Transport"],
      defenses: [
        {
          title: "Exact origins, never *",
          text: "targetOrigin is always explicit, and every message is checked for its source window and origin.",
          evidence: [["mf-bridge.test.ts", "handshakes with an explicit targetOrigin, never *"], ["mf-bridge.test.ts", "always drops messages from other origins or other windows (property)"]],
          ids: ["CWE-346"],
        },
        {
          title: "Typed, bounded messages",
          text: "Per type: allow-list, validator and size limit; unknown types are dropped without an answer.",
          evidence: [["mf-bridge.test.ts", "delivers valid messages and drops everything else"]],
          ids: ["CWE-20"],
        },
        {
          title: "No tokens between windows",
          text: "Payloads with secret-looking keys are refused in both directions unless the type opts in.",
          evidence: [["mf-bridge.test.ts", "refuses to send secrets or oversized payloads"]],
          ids: ["CWE-200", "CWE-522"],
        },
        {
          title: "A peer cannot change origin",
          text: "After the handshake, a peer whose origin changes is ignored.",
          evidence: [["mf-bridge.test.ts", "ignores a peer whose origin changes after the handshake, and does nothing without a target"]],
          ids: ["CWE-346"],
        },
      ],
    },
  },
  {
    name: "mf-frame",
    title: "mf-frame",
    category: "Micro-frontends",
    description: "The host side of an embed: a sandboxed iframe that the embedded app sizes over mf-bridge, and the headers for both apps.",
    examples: [{ title: "Live remote", description: "This site's billing remote, framed and sized over the bridge.", file: "mf-frame/demo", component: MfFrameDemo }],
    usage: `import { MfFrame, useReportHeight } from "@/components/ui/mf-frame";
import { embeddedAppHeaders, hostAppHeaders } from "@/lib/mf-embed-headers";

// Host page
<MfFrame src="https://agent.example.com/panel" title="Agent panel" maxHeight={900} />

// Embedded app (any component that renders inside the frame)
useReportHeight(["https://backoffice.example.com"]);

// middleware.ts of each app
headers: hostAppHeaders({ nonce, frameOrigins: [process.env.AGENT_ORIGIN!] })          // host
headers: embeddedAppHeaders({ nonce, hostOrigins: [process.env.BACKOFFICE_ORIGIN!] })  // embedded app`,
    props: [
      { name: "src / title", type: "string / string", description: "Absolute http(s) URL; title is required." },
      { name: "sandbox", type: "SandboxToken[]", default: '["allow-scripts", "allow-forms"]', description: "Known tokens only; allow-same-origin is refused when the frame has the host's origin." },
      { name: "allow / referrerPolicy", type: "string", default: '"" / "strict-origin-when-cross-origin"', description: "Permissions policy (empty: no camera, mic, geolocation…) and referrer." },
      { name: "minHeight / maxHeight", type: "number", default: "120 / 4000", description: "Bounds for the height the embedded app reports." },
      { name: "onBridge / messages", type: "(bridge) => void / specs", description: "The mf-bridge to the embedded app, for its own messages." },
      { name: "onDrop", type: "(reason: string) => void", description: "Every message the bridge drops, with the reason and never the payload: for a log or a counter." },
      { name: "useReportHeight(hostOrigins)", type: "hook", description: "In the embedded app: reports the document height to the host." },
      { name: "embeddedAppHeaders / hostAppHeaders", type: "lib", description: "securityHeaders with frame-ancestors (embedded) or frame-src (host) from configuration." },
    ],
    security: {
      sinks: ["Transport", "DOM"],
      defenses: [
        {
          title: "A minimal sandbox",
          text: "allow-same-origin is refused for a frame on the host's origin, because with allow-scripts it could remove its own sandbox.",
          evidence: [["mf-frame.test.tsx", "keeps known tokens and refuses allow-same-origin for a same-origin frame"], ["mf-frame.test.tsx", "never yields allow-same-origin for the host's own origin, nor an unknown token (property)"]],
          ids: ["CWE-1021", "CWE-693"],
        },
        {
          title: "A locked-down frame",
          text: "A required title, an empty permissions policy, a referrer policy, and nothing for a URL that is not http(s).",
          evidence: [["mf-frame.test.tsx", "renders a titled, sandboxed frame with an empty permissions policy and a referrer policy"], ["mf-frame.test.tsx", "renders nothing for a URL that is not http(s)"]],
          ids: ["CWE-79", "CWE-1021"],
        },
        {
          title: "A same-origin frame stays sandboxed",
          text: "A frame on the host's own origin never gets allow-same-origin, so it runs in an opaque origin; the bridge accepts its \"null\" origin from that frame's window only.",
          evidence: [["mf-frame.test.tsx", "talks to a frame on its own origin, whose sandbox makes its origin opaque"], ["mf-bridge.test.ts", "talks to a frame sandboxed on the host's origin: the null origin only from that frame, and posts with *"]],
          ids: ["CWE-346", "CWE-1021"],
        },
        {
          title: "Framing only where configured",
          text: "frame-ancestors on the embedded app and frame-src on the host come from configuration and never become *.",
          evidence: [["mf-frame.test.tsx", "lets only configured hosts frame the embedded app, never a wildcard"], ["mf-frame.test.tsx", "lets the host frame only configured apps"]],
          ids: ["CWE-1021", "OWASP A05:2021"],
        },
        {
          title: "Height from the frame's origin only",
          text: "Over mf-bridge, bounded, ignoring every other origin.",
          evidence: [["mf-frame.test.tsx", "takes its height from the embedded app over the bridge, bounded, and ignores other origins"]],
          ids: ["CWE-346"],
        },
      ],
    },
    accessibility: {
      notes: ["The iframe needs a title, which is its accessible name.", "Its height follows the embedded page (useReportHeight), so there is no second scrollbar to reach."],
      motion: "The frame grows to the reported height on a spring and fades in when loaded. With reduced motion it resizes at once.",
    },
  },
  {
    name: "mf-element",
    title: "mf-element",
    category: "Micro-frontends",
    description: "Turns a React component into a Web Component, for embeds that need tighter integration with the host page than an iframe gives.",
    examples: [{ title: "A custom element", description: "An attribute in, an event out, its own styles in a shadow root.", file: "mf-element/demo", component: MfElementDemo }],
    usage: `import { defineMfElement } from "@/lib/mf-element";

defineMfElement<{ agentName?: string; config?: Config }>("agent-panel", AgentPanel, {
  attributes: { "agent-name": "string", config: "json" },
  events: ["approve"],
  css: builtTailwindCss,
});

// Host page
<agent-panel agent-name="Avalo"></agent-panel>
panel.addEventListener("approve", (e) => approve(e.detail));`,
    props: [
      { name: "attributes", type: 'Record<name, "string" | "number" | "boolean" | "json">', description: "Typed attributes, mapped to camelCase props and properties; bad values become undefined." },
      { name: "events", type: "string[]", description: "Events the component may emit through emit(); composed, bubbling CustomEvents. Others throw." },
      { name: "css", type: "string", description: "Stylesheet for the shadow root." },
      { name: "maxJsonBytes", type: "number", default: "16384", description: "Largest JSON attribute accepted." },
      { name: "el.props = { … }", type: "property", description: "For values that are not attributes, like objects and callbacks." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "Typed attributes",
          text: "Attributes are parsed by type, with a size limit for JSON; bad values never reach the component.",
          evidence: [["mf-element.test.tsx", "keeps bad attribute values out: not-a-number, broken or oversized JSON"], ["mf-element.test.tsx", "never throws on any attribute value (property)"]],
          ids: ["CWE-20", "CWE-770"],
        },
        {
          title: "Declared events only",
          text: "Only events the element declares leave it.",
          evidence: [["mf-element.test.tsx", "emits declared events as composed CustomEvents and refuses undeclared ones"]],
          ids: ["CWE-200"],
        },
      ],
      notes: [
    "Trade-off: the element's code runs in the host page's origin. Every script on that page can reach what it holds, so never hand it a token unless the host accepts that risk; prefer an iframe (mf-frame) when the two apps should not trust each other.",
    "The host's CSP must allow the element's origin in script-src (and connect-src for its API).",
    "Shadow DOM isolates CSS both ways; it is not a security boundary.",
    "Attributes are parsed by type with a size limit for JSON, and only declared events leave the element.",
  ],
    },
  },
  {
    name: "mf-context",
    title: "mf-context",
    category: "Micro-frontends",
    description: "Keeps an embedded app in step with its host: theme, locale and session, over mf-bridge.",
    examples: [{ title: "Live shell and remote", description: "Change the shell's theme or sign out: the remote follows.", file: "mf-context/demo", component: MfContextDemo }],
    usage: `import { hostMessages, useMfContext, useMfContextHost } from "@/lib/mf-context";

// Host
const [bridge, setBridge] = useState<Bridge<typeof hostMessages> | null>(null);
const endSession = useMfContextHost(bridge, { mode, theme, locale });
<MfFrame src={AGENT_URL} title="Agent panel" messages={hostMessages} onBridge={setBridge} />
// on logout: endSession(); then sign out

// Embedded app
const { locale } = useMfContext({ hostOrigins: [BACKOFFICE_ORIGIN], locales: ["en", "pt-BR", "es"], onSessionEnd: signOut });`,
    props: [
      { name: "useMfContextHost(bridge, { mode, theme?, locale })", type: "() => void", description: "Sends theme and locale on change; returns endSession for logout; relays the child's activity to useIdleTimeout." },
      { name: "useMfContext({ hostOrigins, locales, onSessionEnd, activityEveryMs? })", type: "{ locale; mode }", description: "Applies the host's theme, follows its locale, ends the session with it and reports activity (every 30 s at most)." },
      { name: "hostMessages / childMessages(locales)", type: "message specs", description: "What each side accepts." },
      { name: "ACTIVITY_EVENT", type: "string", description: "Dispatch on window to make useIdleTimeout count activity it cannot see." },
    ],
    security: {
      sinks: ["Session", "Transport"],
      defenses: [
        {
          title: "Logout ends both sessions",
          text: "The host's logout ends the embedded app's session, and activity in either keeps the shared idle timeout alive.",
          evidence: [["mf-context.test.tsx", "relays the child's activity to the idle timeout and ends the child's session on logout"], ["mf-context.test.tsx", "follows the host's theme and locale, validated, and ends the session with it"]],
          ids: ["CWE-613", "OWASP A07:2021"],
        },
        {
          title: "Context is validated data",
          text: "Known locales only, themes validated again, session messages empty.",
          evidence: [["mf-context.test.tsx", "accepts only known locales, valid themes and empty session messages"]],
          ids: ["CWE-20"],
        },
      ],
      backend: "end the embedded app's session on its own server too when session:end arrives.",
    },
  },
  {
    name: "use-idle-timeout",
    title: "useIdleTimeout",
    category: "Security",
    description: "Hook that calls back after a period without pointer or keyboard activity, so the app ends the session.",
    examples: [{ title: "Idle timeout", description: "Fast-forward makes the quiet spell 6 seconds; stay still to see the warning, then the sign-out.", file: "use-idle-timeout/demo", component: UseIdleTimeoutDemo }],
    usage: `import { useIdleTimeout } from "@/hooks/use-idle-timeout";

useIdleTimeout(15 * 60_000, () => signOut("idle"));`,
    props: [
      { name: "ms", type: "number", description: "Idle period in milliseconds." },
      { name: "onIdle", type: "() => void", description: "Called once per idle period; sign out and clear state here." },
      { name: "enabled", type: "boolean", default: "true", description: "Off while signed out." },
    ],
    security: {
      sinks: ["Session"],
      defenses: [
        {
          title: "Idle sessions end",
          text: "Fires after the idle period, and at once when a tab comes back past the limit (a laptop that slept).",
          evidence: [["use-idle-timeout.test.tsx", "fires after the idle period and activity restarts the countdown"], ["use-idle-timeout.test.tsx", "fires at once when the tab comes back past the limit"]],
          ids: ["CWE-613", "OWASP A07:2021", "ATT&CK T1185"],
        },
      ],
      backend: "revoke the session on the server when it fires; clearing it in the browser is not enough.",
    },
  },
  {
    name: "api",
    title: "api",
    category: "Transport",
    description: "Same-origin JSON client for the app's own backend.",
    examples: [{ title: "Simulated backend", description: "api() against a backend simulated in the page: what each request carries and how each answer is read.", file: "api/simulator", component: ApiSimulator }],
    usage: `import { api } from "@/lib/api";

const approvals = await api<Approval[]>("/api/approvals");
await api("/api/approvals/42/approve", { body: {}, csrfCookie: "XSRF-TOKEN" });`,
    props: [
      { name: "path", type: "string", description: "Relative path on this origin; absolute URLs are refused." },
      { name: "body", type: "unknown", description: "JSON body; defaults the method to POST." },
      { name: "timeoutMs", type: "number", default: "30000", description: "Abort after this long." },
      { name: "csrfCookie", type: "string", description: "Cookie whose value is echoed in X-CSRF-Token." },
    ],
    security: {
      sinks: ["Transport", "Session"],
      defenses: [
        {
          title: "Same-origin only, no redirects",
          text: "Only relative paths: the session cookie never travels to another host, and a redirect is refused.",
          evidence: [["api.test.ts", "sends same-origin JSON with the CSRF header and refuses redirects"], ["api.test.ts", "refuses %j before any request"]],
          ids: ["CWE-601", "CWE-200", "ATT&CK T1185"],
        },
        {
          title: "A CSRF header on every call",
          text: "X-Requested-With, which a cross-site form cannot send.",
          evidence: [["api.test.ts", "sends same-origin JSON with the CSRF header and refuses redirects"]],
          ids: ["CWE-352", "OWASP A01:2021"],
        },
        {
          title: "JSON only",
          text: "A response that is not application/json is refused instead of interpreted.",
          evidence: [["api.test.ts", "refuses a 200 that is not JSON instead of interpreting it"]],
          ids: ["CWE-20"],
        },
      ],
      backend: "require X-Requested-With (or a double-submit token) on every mutating route, and keep the session in an HttpOnly, Secure, SameSite cookie.",
      notes: ["Never store a token in localStorage or sessionStorage."],
    },
  },
  {
    name: "security-headers",
    title: "securityHeaders",
    category: "Security",
    description: "Response headers for an app built with these components: strict CSP for scripts and styles, HSTS, no framing, no sniffing.",
    examples: [{ title: "Builder", description: "Type origins one per line and see the policy the server would send. Wildcards and paths are dropped.", file: "security-headers/builder", component: SecurityHeadersBuilder },
      { title: "Cache policy", description: "Pick a preset or let cachePolicyFor decide from the path; a nonce on a cacheable response is refused.", file: "security-headers/cache", component: SecurityHeadersCache },
    ],
    usage: `import { cachePolicyFor, securityHeaders } from "@/lib/security-headers";

// proxy.ts (Next.js) or any edge/middleware
const nonce = crypto.randomUUID();
for (const [name, value] of Object.entries(securityHeaders({ nonce }))) response.headers.set(name, value);

// One middleware for every route: public files may be cached, pages with a nonce never.
const policy = cachePolicyFor(pathname, { public: ["/sitemap.xml", "/robots.txt", /^\/llms/], immutable: [/^\/_next\/static\//] });
const headers = policy === "private" ? securityHeaders({ nonce }) : securityHeaders({ cacheControl: policy });`,
    props: [
      { name: "nonce", type: "string", description: "Per-request nonce; the framework must put it on its scripts." },
      { name: "hashes", type: "string[]", description: "Static sites: sha256-/sha384-/sha512- hashes of the inline scripts, computed at build time. Use instead of nonce; the policy is then 'self' plus the hashes." },
      { name: "styleHashes", type: "string[]", default: "[]", description: "Hashes of the inline <style> elements a page carries without a nonce (Base UI's scrollbar style, the framework's error page); a static site computes them at build time." },
      { name: "connectSrc", type: "string[]", default: "[]", description: "Extra origins for fetch and SSE." },
      { name: "imgSrc", type: "string[]", default: "[]", description: "Extra origins for images." },
      { name: "frameAncestors", type: "string[]", default: "[]", description: "Who may frame the page; nobody by default." },
      { name: "mediaSrc", type: "string[]", description: "Origins for video and audio, e.g. a media CDN. Unset, media follows default-src 'self'. Exact origins only." },
      { name: "fontSrc", type: "string[]", default: "[]", description: "Extra origins for fonts, e.g. self-hosted fonts on a CDN. Exact origins only." },
      { name: "upgradeInsecureRequests", type: "boolean", default: "true", description: "Upgrades http: requests to https:. Turn it off only for a plain-HTTP origin (a local run, e2e)." },
      { name: "cacheControl", type: "\"private\" | \"public\" | \"immutable\"", default: "\"private\"", description: "private: no-store. public: an hour, then stale for a day. immutable: a year, for hashed assets. None has no-transform, so a proxy may compress the response; any other value throws." },
      { name: "cachePolicyFor(path, { public, immutable })", type: "CachePolicy", description: "The policy for a path from lists of exact strings and RegExps; private when nothing matches, public when both do." },
    ],
    security: {
      sinks: ["Session", "DOM"],
      defenses: [
        {
          title: "A strict script policy",
          text: "Nonce and strict-dynamic, or 'self' and build-time hashes: no inline script, no eval; a policy that cannot be strict throws.",
          evidence: [["security-headers.test.ts", "allows no inline script, eval, plugin, framing or foreign form target"], ["security-headers.test.ts", "refuses a policy it cannot make strict"]],
          ids: ["CWE-79", "CWE-693", "ATT&CK T1059.007"],
        },
        {
          title: "No injected stylesheet",
          text: "Style elements only from this origin, the nonce or a build-time hash, never 'unsafe-inline'; the components' style attributes stay allowed, since an attribute runs no script.",
          evidence: [["security-headers.test.ts", "refuses an injected <style> element but keeps the components' style attributes"]],
          ids: ["CWE-79", "CWE-693"],
        },
        {
          title: "No framing, no foreign forms",
          text: "frame-ancestors 'none' and X-Frame-Options DENY stop clickjacking; form-action 'self' stops form hijacking.",
          evidence: [["security-headers.test.ts", "allows no inline script, eval, plugin, framing or foreign form target"]],
          ids: ["CWE-1021", "OWASP A05:2021"],
        },
        {
          title: "Media and fonts from exact origins",
          text: "mediaSrc and fontSrc keep only exact http(s) origins: a wildcard, a path or garbage is dropped, never widened.",
          evidence: [["security-headers.test.ts", "allows media and fonts only from the exact origins named (#201)"]],
          ids: ["CWE-693", "CWE-829"],
        },
        {
          title: "Cached only when asked, never with a nonce",
          text: "no-store unless the response opts into a preset; a nonce together with a cacheable preset, or any value that is not a preset, throws; a cacheable response without scripts gets script-src 'none'.",
          evidence: [["security-headers.test.ts", "refuses a nonce on a cacheable response, and any value that is not a preset"], ["security-headers.test.ts", "is no-store by default, so forgetting the option never makes a page cacheable"]],
          ids: ["CWE-524", "CWE-525"],
        },
        {
          title: "Transport, sniffing and caching",
          text: "HSTS, nosniff, a strict referrer policy, opener isolation and no-store for pages with personal data.",
          evidence: [["security-headers.test.ts", "sets transport, sniffing, referrer, isolation and caching headers"]],
          ids: ["CWE-319", "CWE-524", "ATT&CK T1557"],
        },
      ],
      backend: "apply them from the framework's middleware on every response, and pass the nonce to its scripts and to ScrollArea.",
    },
  },
  {
    name: "untrusted",
    title: "untrusted",
    category: "Security",
    description: "Helpers for text written by agents or people: removes code points that hide text from the reader.",
    examples: [{ title: "Inspector", description: "Paste text or a link: hidden characters are shown and stripped, unsafe links refused.", file: "untrusted/inspector", component: UntrustedInspector }],
    usage: `import { stripInvisible } from "@/lib/untrusted";

stripInvisible("Pay\\u{E0049}\\u{E0047}\\u{E004E}\\u{E004F}\\u{E0052}\\u{E0045} the invoice") // "Pay the invoice"`,
    props: [
      { name: "stripInvisible", type: "(text: string) => string", description: "Removes zero-width, bidi-override and Unicode-tag code points." },
      { name: "hasInvisible", type: "(text: string) => boolean", description: "Whether the text carries any of them." },
    ],
    security: {
      sinks: ["DOM", "Input"],
      defenses: [
        {
          title: "Hidden text is removed",
          text: "Unicode tags, zero-width text and bidi overrides go; joiners and direction marks that emoji and right-to-left scripts need stay.",
          evidence: [["untrusted.test.ts", "removes Unicode tags, zero-width text and bidi overrides"], ["untrusted.test.ts", "is idempotent and never leaves an invisible code point (property)"]],
          ids: ["ATLAS AML.T0051.001", "OWASP LLM01:2025"],
        },
        {
          title: "Only safe URLs",
          text: "safeUrl keeps http, https, mailto and relative references, whatever the case or whitespace tricks.",
          evidence: [["untrusted.test.ts", "never returns a URL with a protocol outside the allow list (property)"], ["untrusted.test.ts", "never lets a scheme through by case or whitespace tricks (property)"]],
          ids: ["CWE-79", "CWE-601"],
        },
      ],
      notes: ["Markdown, Chat, Approval Card and Hand Raise already apply it to what they show and send."],
    },
  },
  {
    name: "share-card",
    title: "Share card",
    category: "Foundations",
    description: "The image a chat app or network shows for a shared link: a 1200×630 card drawn at build time with next/og, in the theme's colors.",
    examples: [{ title: "Light, dark and brand", file: "share-card/demo", component: ShareCardDemo }],
    usage: `// app/docs/dropdown-menu/opengraph-image.tsx: a static PNG, drawn at build time
import { ImageResponse } from "next/og";
import { ShareCard, SHARE_CARD_SIZE, shareCardFonts } from "@/components/ui/share-card";

export const dynamic = "force-static";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";
export const alt = "Dropdown Menu · Aedis UI";

export default async function Image() {
  return new ImageResponse(
    <ShareCard brand={{ name: "Aedis UI", logo: <Logo /> }} eyebrow="Overlays · Component" title="Dropdown Menu"
      description="A menu of actions." chips={["Base UI", "Keyboard"]} domain="ui.aedis.build" art={<MenuArt />} />,
    { ...SHARE_CARD_SIZE, fonts: await shareCardFonts() },
  );
}`,
    props: [
      { name: "brand", type: "{ name: string; logo?: ReactNode }", description: "Product name, and its logo as a local SVG node." },
      { name: "eyebrow / title / description", type: "string", description: "Text only, bounded (40 / 72 / 150 characters), the title on three lines and the description on two at most; longer text ends with an ellipsis." },
      { name: "chips", type: "string[]", description: "Up to four tags of 24 characters; those that do not fit beside the domain are dropped." },
      { name: "domain", type: "string", description: "The site, bottom right." },
      { name: "art", type: "ReactNode", description: "The 430×300 illustration on the right: a local React or SVG node, never a URL." },
      { name: "theme / mode", type: '"light" | "dark" | "brand" | CustomTheme / "light" | "dark"', default: '"light"', description: "Colors come from the theme tokens. A custom theme is validated first, and mode picks its light or dark colors." },
      { name: "shareCardFonts(root?)", type: "() => Promise<Font[]>", description: "Geist Regular, SemiBold and Bold from the geist package (SIL Open Font License), read at build time." },
      { name: "cardText(value, max) / fitChips(chips, domain)", type: "helpers", description: "What the card draws: hidden and unsupported characters removed and length bounded; the chips that fit." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "The build reaches no host",
          text: "next/og fetches a font from Google or an emoji from a CDN for any character its fonts lack. The card keeps only the characters the bundled Geist covers, and its logo and art are local nodes, never a URL.",
          evidence: [["share-card.test.tsx", "keeps worst-case text inside the card: long, unbreakable, non-Latin, emoji, hidden characters"], ["share-card.test.tsx", "bounds and cleans text: ellipsis, no hidden or unsupported characters"]],
          ids: ["CWE-918", "CWE-829"],
        },
        {
          title: "Text cannot break the layout",
          text: "Every text is bounded, cleaned of hidden characters and clamped with an ellipsis; the padding and the art stay untouched whatever the text.",
          evidence: [["share-card.test.tsx", "keeps worst-case text inside the card: long, unbreakable, non-Latin, emoji, hidden characters"], ["share-card.test.tsx", "keeps only the chips that fit beside the domain, in order"]],
          ids: ["CWE-1287", "ATLAS AML.T0051.001"],
        },
        {
          title: "A custom theme is data",
          text: "A custom theme goes through the theme validator before its colors are used; an invalid one falls back to the light theme.",
          evidence: [["share-card.test.tsx", "takes its colors from the theme tokens, and a custom theme only once validated"]],
          ids: ["CWE-20"],
        },
      ],
      notes: ["The PNG is a static file: the image route runs at build time and nothing is drawn per request."],
    },
    accessibility: {
      notes: ["Give the image alt text (the route's alt export, or shareMetadata's image.alt), usually the page title and the site name.", "The card's text uses the theme's contrast pairs: foreground and muted text on the background."],
    },
  },
  {
    name: "share-metadata",
    title: "shareMetadata",
    category: "Foundations",
    description: "Every tag a link preview reads, from one call in a page's metadata: Open Graph, the Twitter large card and the canonical link.",
    examples: [{ title: "Builder", description: "The tags a link preview reads; an image on another origin is refused.", file: "share-metadata/builder", component: ShareMetadataBuilder }],
    usage: `import { shareMetadata } from "@/lib/share-metadata";

export const metadata = shareMetadata({
  site: { origin: "https://ui.aedis.build", name: "Aedis UI" },
  url: "https://ui.aedis.build/docs/dropdown-menu",
  title: "Dropdown Menu",
  description: "A menu of actions: account menu, row actions, a more button.",
  image: { url: "https://ui.aedis.build/docs/dropdown-menu/opengraph-image.png", alt: "Dropdown Menu · Aedis UI" },
  type: "article",
});`,
    props: [
      { name: "site", type: "{ origin: string; name: string }", description: "The site's https origin, and its name (og:site_name)." },
      { name: "url", type: "string", description: "The canonical URL (og:url and the canonical link): absolute https on the site's origin." },
      { name: "title / description", type: "string", description: "og:title, og:description and the Twitter card's, with hidden characters removed." },
      { name: "image", type: "{ url: string; alt: string; width?: number; height?: number }", description: "og:image and twitter:image: absolute https on the site's origin, 1200×630 by default, alt required." },
      { name: "type", type: '"website" | "article"', default: '"website"', description: "og:type." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "Only the site's own URLs",
          text: "The page and image URLs go through safeUrl and must be absolute https on the configured origin; anything else fails the build instead of pointing a preview elsewhere.",
          evidence: [["share-metadata.test.ts", "rejects a relative, foreign-origin, non-https or scripted image or page URL"]],
          ids: ["CWE-601", "CWE-79"],
        },
        {
          title: "No tag forgotten, no hidden text",
          text: "One call returns every Open Graph and Twitter tag with the image size and alt; titles and descriptions lose their hidden characters.",
          evidence: [["share-metadata.test.ts", "returns every Open Graph and Twitter tag a link preview reads"], ["share-metadata.test.ts", "needs an https site origin and an alt text, and strips hidden characters from the text"]],
          ids: ["ATLAS AML.T0051.001"],
        },
      ],
    },
  },
  {
    name: "sidebar",
    title: "Sidebar",
    category: "Navigation",
    description: "Grouped navigation with counters for items waiting on a person, and areas that open later.",
    examples: [{ title: "Sidebar", file: "sidebar/demo", component: SidebarDemo }],
    usage: `import Link from "next/link";
import { Sidebar } from "@/components/ui/sidebar";

<Sidebar
  linkComponent={Link}
  groups={[{ label: "Work", items: [{ href: "/approvals", label: "Approvals", count: 3, countLabel: "3 waiting" }] }]}
/>`,
    props: [
      { name: "groups", type: "{ label; items: SidebarItem[] }[]", description: "Groups of items: href, label, count, countLabel, active, icon, disabled, disabledReason." },
      { name: "header / footer", type: "ReactNode", description: "Organization switcher at the top, signed-in user at the bottom." },
      { name: "linkComponent", type: "ComponentType", default: "<a>", description: "Your router link, e.g. Next.js Link." },
      { name: "label", type: "string", default: '"Main navigation"', description: "Accessible name of the nav landmark." },
    ],
    security: { sinks: [], notes: [
      "Disabled items stay visible with their reason instead of disappearing, so people know an area exists.",
      "Counters have accessible text (countLabel), not just a number.",
    ] },
    accessibility: {
      keyboard: [["Tab", "Moves through the links; disabled items are skipped."]],
      notes: ["A nav landmark named \"Main navigation\" by default; the current item has aria-current=\"page\".", "Counters are read from countLabel, not the bare number.", "A disabled item stays visible with aria-disabled and its reason."],
      motion: "Items sink slightly when pressed. With reduced motion there is no scale.",
    },
  },
  {
    name: "button",
    title: "Button",
    category: "Actions",
    description: "The base action. Defaults to type=\"button\", so it never submits a form by accident.",
    examples: [
      { title: "Button", file: "button/demo", component: ButtonDemo },
      { title: "Sizes and states", file: "button/sizes", component: ButtonSizes },
      { title: "As a link", description: "render keeps the element's own role: these are links styled as buttons.", file: "button/as-link", component: ButtonAsLink },
      { title: "Shapes and a moving icon", description: "Every variant in the theme radius and as a pill. An icon marked data-slot=\"icon\" slides forward on hover and keyboard focus.", file: "button/shapes", component: ButtonShapes },
    ],
    usage: `import { Button } from "@/components/ui/button";

<Button onClick={save}>Save</Button>
<Button type="submit">Send</Button>`,
    props: [
      { name: "variant", type: '"default" | "secondary" | "outline" | "ghost" | "destructive" | "link"', default: '"default"', description: "Visual style." },
      { name: "size", type: '"default" | "sm" | "lg" | "icon"', default: '"default"', description: "Height and padding." },
      { name: "shape", type: '"default" | "pill"', default: '"default"', description: "default follows the theme radius; pill rounds this button fully without changing the radius of anything else. Also on CopyButton." },
      { name: "render", type: "ReactElement | (props, state) => ReactElement", description: "Render another element (e.g. a link) with the button styles. It keeps its own role, so a link stays a link." },
    ],
    security: { sinks: [], notes: ["Defaults to type=\"button\": submitting a form must be explicit (type=\"submit\")."] },
    accessibility: {
      keyboard: [["Enter / Space", "Activates the button."]],
      notes: ["An icon-only button needs an aria-label.", "Disabled buttons use the native disabled attribute, so they leave the tab order."],
      motion: "Presses sink on pointer-down and spring back on release. A child with data-slot=\"icon\" moves 2 px forward on hover and focus, in 200 ms. With reduced motion there is no scale and no movement.",
    },
  },
  {
    name: "alert-dialog",
    title: "Alert Dialog",
    category: "Overlays",
    description: "Confirmation for actions that cannot be undone or that leave the company: send, approve, delete.",
    examples: [{ title: "Alert Dialog", file: "alert-dialog/demo", component: AlertDialogDemo }],
    usage: `import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

<AlertDialog>
  <AlertDialogTrigger render={<Button />}>Send</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Send this proposal to the client?</AlertDialogTitle>
      <AlertDialogDescription>It leaves the company right away.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={send}>Send</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
    props: baseProps("@base-ui/react AlertDialog"),
    security: { sinks: [], notes: [
      "Focus starts on Cancel, so pressing Enter right after opening never confirms.",
      "Escape and clicking outside do not confirm; only the action button does.",
    ] },
    accessibility: {
      keyboard: [["Enter", "Right after opening, activates Cancel: focus starts there."], ["Tab", "Moves between Cancel and the action, inside the dialog only."], ["Esc", "Closes without confirming."]],
      notes: ["role=\"alertdialog\" with aria-modal, named by its title and described by its description."],
      motion: "It materializes with a short blur clearing and closes in 200 ms. With reduced motion it only fades.",
    },
  },
  {
    name: "avatar",
    title: "Avatar",
    category: "Data display",
    description: "Image with fallback initials, used for people and agents.",
    examples: [{ title: "Avatar", file: "avatar/demo", component: AvatarDemo }],
    usage: `import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src={user.photo} alt="" />
  <AvatarFallback>RA</AvatarFallback>
</Avatar>`,
    props: baseProps("@base-ui/react Avatar"),
    security: { sinks: [], notes: ["Load avatar images from origins your CSP allows; the fallback renders when the image fails."] },
    accessibility: {
      notes: ["Next to a visible name, give the image alt=\"\" so the name is not read twice; alone, give it the person's name."],
    },
  },
  {
    name: "badge",
    title: "Badge",
    category: "Data display",
    description: "Small status label: level, channel, state.",
    examples: [{ title: "Badge", file: "badge/demo", component: BadgeDemo }],
    usage: `import { Badge } from "@/components/ui/badge";

<Badge variant="secondary">Draft</Badge>`,
    props: [{ name: "variant", type: '"default" | "secondary" | "accent" | "outline" | "destructive"', default: '"default"', description: "Visual style." }],
    security: { sinks: [], notes: ["Text only; pass labels as children."] },
    accessibility: {
      notes: ["Inline text. If a badge only carries a number, add the meaning in text (\"3 waiting\")."],
    },
  },
  {
    name: "card",
    title: "Card",
    category: "Data display",
    description: "Container with header, content and footer.",
    examples: [{ title: "Card", file: "card/demo", component: CardDemo }],
    usage: `import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Account Executive</CardTitle>
    <CardDescription>Turns opportunities into signed projects.</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
</Card>`,
    props: [
      { name: "CardTitle as", type: '"h2" | "h3" | "h4" | "h5" | "h6"', default: '"h3"', description: "The heading level, so the card fits the page outline: h2 right under the page heading." },
      { name: "...props", type: "div props", description: "Each part forwards the props of its element." },
    ],
    security: { sinks: [], notes: ["No behavior; render agent text inside with the Chat or markdown components, never as raw HTML."] },
    accessibility: {
      notes: ["CardTitle is an h3 unless `as` says otherwise: pick the level that follows the heading before it, never skip one."],
    },
  },
  {
    name: "checkbox",
    title: "Checkbox",
    category: "Forms",
    description: "Checkbox for consent and settings.",
    examples: [{ title: "Checkbox", file: "checkbox/demo", component: CheckboxDemo }],
    usage: `import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

<Checkbox id="notify" checked={notify} onCheckedChange={setNotify} />
<Label htmlFor="notify">Notify me</Label>`,
    props: baseProps("@base-ui/react Checkbox"),
    security: { sinks: [], notes: ["Consent checkboxes must start unchecked; do not pass defaultChecked for consent."] },
    accessibility: {
      keyboard: [["Space", "Checks and unchecks."]],
      notes: ["role=\"checkbox\" with aria-checked; a hidden native input keeps forms and autofill working."],
      motion: "The border and fill change color in 200 ms; the check mark appears with them.",
    },
  },
  {
    name: "dialog",
    title: "Dialog",
    category: "Overlays",
    description: "Modal dialog for forms and details. Use Alert Dialog for confirmations.",
    examples: [{ title: "Dialog", file: "dialog/demo", component: DialogDemo }],
    usage: `import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger render={<Button variant="outline" />}>Invite a person</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Invite a person</DialogTitle>
      <DialogDescription>They join after accepting the invitation.</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>`,
    props: baseProps("@base-ui/react Dialog"),
    security: { sinks: [], notes: ["Focus is trapped while open and returns to the trigger on close."] },
    accessibility: {
      keyboard: [["Tab / Shift+Tab", "Moves focus inside the dialog only."], ["Esc", "Closes it and returns focus to the trigger."]],
      notes: ["role=\"dialog\" with aria-modal; DialogTitle and DialogDescription become its name and description."],
      motion: "It materializes: it scales in with a short blur clearing while the scrim fades in, and closes in 200 ms. With reduced motion it only fades.",
    },
  },
  {
    name: "command",
    title: "Command",
    category: "Overlays",
    description: "A search box over a list, alone or in a dialog: type to filter, arrow keys to move, Enter to choose.",
    examples: [{ title: "Command", file: "command/demo", component: CommandDemo }],
    usage: `import { CommandDialog } from "@/components/ui/command";

<CommandDialog
  open={open}
  onOpenChange={setOpen}
  items={[{ value: "/approvals", label: "Approvals", group: "Pages" }]}
  onSelect={(item) => router.push(item.value)}
/>`,
    props: [
      { name: "items", type: "CommandItem[]", description: "value, label, and optional description and group. Shown as text, never as markup." },
      { name: "onSelect", type: "(item: CommandItem) => void", description: "Called with the chosen item, by click or Enter." },
      { name: "labels", type: "Partial<CommandLabels>", description: "Override single strings; the rest comes from the Locale provider." },
      { name: "open, onOpenChange", type: "CommandDialog only", description: "Controlled dialog state, e.g. toggled by ⌘K." },
    ],
    security: {
      sinks: ["DOM", "Input"],
      defenses: [
        {
          title: "Items are text",
          text: "Labels, descriptions and groups render as text; markup in them is shown, never parsed.",
          evidence: [["command.test.tsx", "filters as you type, moves with the arrows and chooses with Enter"]],
          ids: ["CWE-79"],
        },
        {
          title: "A bounded query",
          text: "The search field is limited to 256 characters, like every Aedis Input.",
          evidence: [["command.test.tsx", "says when nothing matches, ignores Enter then and bounds the query"]],
          ids: ["CWE-770"],
        },
      ],
    },
    accessibility: {
      keyboard: [["↑ ↓", "Moves the active option; Home and End go to the first and last."], ["Enter", "Chooses the active option."], ["Esc", "Closes the dialog and returns focus."]],
      notes: ["The field is a combobox that controls a listbox; focus stays in the field and the active option is announced through aria-activedescendant.", "When nothing matches, a status message says so."],
      motion: "The dialog materializes and closes in 200 ms. With reduced motion it only fades.",
    },
  },
  {
    name: "input",
    title: "Input",
    category: "Forms",
    description: "Text input.",
    examples: [
      { title: "Input", file: "input/demo", component: InputDemo },
      { title: "Invalid and disabled", description: "aria-invalid draws the error border; tie the message to the field with aria-describedby.", file: "input/states", component: InputStates },
    ],
    usage: `import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" maxLength={254} />`,
    props: [
      { name: "maxLength", type: "number", default: "256 for text-like types", description: "Length limit; match it to the server's." },
      { name: "...props", type: "input props", description: "Every prop of the native input. Set aria-invalid to show the error state." },
    ],
    security: {
      sinks: ["Input"],
      defenses: [
        {
          title: "Bounded by default",
          text: "Text-like types are limited to 256 characters; the limit can be changed, not removed.",
          evidence: [["primitives.test.tsx", "text fields are bounded by default and the limit can be changed, not removed"]],
          ids: ["CWE-770", "CWE-20"],
        },
      ],
      backend: "validate every field again with the server's own limit; the browser's is a convenience.",
    },
    accessibility: {
      notes: ["Give every field a Label (htmlFor) or an aria-label.", "Set aria-invalid and aria-describedby to announce an error with its message."],
      motion: "The border color changes on focus and error in 200 ms. Nothing moves.",
    },
  },
  {
    name: "label",
    title: "Label",
    category: "Forms",
    description: "Accessible label for form controls.",
    examples: [{ title: "Label", file: "label/demo", component: LabelDemo }],
    usage: `import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<Label htmlFor="name">Name</Label>
<Input id="name" />`,
    props: [{ name: "...props", type: "label props", description: "Every prop of the native label." }],
    security: { sinks: [], notes: ["Every control needs a label or an aria-label; tests check this with axe."] },
    accessibility: {
      notes: ["A native label: clicking it focuses or toggles its control, and its text is the control's accessible name.", "Placed after a disabled peer control, it dims with it."],
    },
  },
  {
    name: "progress",
    title: "Progress",
    category: "Feedback",
    description: "Progress bar; the base of the usage meter.",
    examples: [{ title: "Progress", file: "progress/demo", component: ProgressDemo }],
    usage: `import { Progress } from "@/components/ui/progress";

<Progress value={62} aria-label="Ceiling used" />`,
    props: [{ name: "value", type: "number", description: "0 to 100; values outside are clamped." }, ...baseProps("@base-ui/react Progress")],
    security: { sinks: [], notes: ["Give it an aria-label; the value is announced to assistive technology."] },
    accessibility: {
      notes: ["role=\"progressbar\" with aria-valuenow; give it an aria-label."],
      motion: "The bar moves to a new value on a critically damped spring. With reduced motion it jumps.",
    },
  },
  ...chartDocs(),
  {
    name: "radio-group",
    title: "Radio Group",
    category: "Forms",
    description: "Single choice among options.",
    examples: [{ title: "Radio Group", file: "radio-group/demo", component: RadioGroupDemo }],
    usage: `import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

<RadioGroup defaultValue="case" aria-label="Scope">
  <RadioGroupItem value="case" id="case" />
  <Label htmlFor="case">Just this case</Label>
</RadioGroup>`,
    props: baseProps("@base-ui/react RadioGroup and Radio"),
    security: { sinks: [], notes: ["Arrow keys move between options; the group needs an accessible name."] },
    accessibility: {
      keyboard: [["Tab", "Moves into the group, to the checked option."], ["↑ ↓ / ← →", "Moves to the next option and checks it."]],
      notes: ["role=\"radiogroup\" with one tab stop; name it with aria-label or aria-labelledby."],
      motion: "The ring and dot change color in 200 ms.",
    },
  },
  {
    name: "separator",
    title: "Separator",
    category: "Data display",
    description: "Visual or semantic divider.",
    examples: [{ title: "Separator", file: "separator/demo", component: SeparatorDemo }],
    usage: `import { Separator } from "@/components/ui/separator";

<Separator />`,
    props: baseProps("@base-ui/react Separator"),
    security: { sinks: [], notes: ["Decorative by default (hidden from assistive technology)."] },
    accessibility: {
      notes: ["Decorative by default (role=\"none\"); pass decorative={false} when it separates sections a reader should hear."],
    },
  },
  {
    name: "skeleton",
    title: "Skeleton",
    category: "Feedback",
    description: "Loading placeholder.",
    examples: [{ title: "Skeleton", file: "skeleton/demo", component: SkeletonDemo }],
    usage: `import { Skeleton } from "@/components/ui/skeleton";

<div aria-busy="true">
  <Skeleton className="h-4 w-48" />
</div>`,
    props: [{ name: "...props", type: "div props", description: "Size it with classes." }],
    security: { sinks: [], notes: ["Hidden from assistive technology; give the loading region role=\"status\", aria-busy and a label."] },
    accessibility: {
      notes: ["Hidden from assistive technology; mark the region that is loading with aria-busy instead."],
      motion: "It pulses. With reduced motion it is still.",
    },
  },
  {
    name: "switch",
    title: "Switch",
    category: "Forms",
    description: "On/off toggle, e.g. the channels an agent answers on.",
    examples: [{ title: "Switch", file: "switch/demo", component: SwitchDemo }],
    usage: `import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

<Switch id="autopilot" checked={on} onCheckedChange={setOn} />
<Label htmlFor="autopilot">Autopilot</Label>`,
    props: baseProps("@base-ui/react Switch"),
    security: { sinks: [], notes: ["Use disabled (not hidden) for settings that cannot be turned off, so the reason stays visible."] },
    accessibility: {
      keyboard: [["Space", "Turns it on and off."]],
      notes: ["role=\"switch\" with aria-checked. Use it for settings that apply at once; use a Checkbox inside a form that is submitted."],
      motion: "The thumb slides on a critically damped spring. With reduced motion it moves without the spring.",
    },
  },
  {
    name: "table",
    title: "Table",
    category: "Data display",
    description: "Responsive table parts; scrolls horizontally on small screens.",
    examples: [{ title: "Table", file: "table/demo", component: TableDemo }],
    usage: `import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow><TableHead>Agent</TableHead><TableHead>Cost</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    <TableRow><TableCell>Sales</TableCell><TableCell>$12</TableCell></TableRow>
  </TableBody>
</Table>`,
    props: [{ name: "...props", type: "table element props", description: "Each part forwards the props of its element." }],
    security: { sinks: [], notes: ["Render cell values as text."] },
    accessibility: {
      notes: ["A native table: headers are th, so screen readers announce the column with each cell. Add a TableCaption to name it."],
    },
  },
  {
    name: "tabs",
    title: "Tabs",
    category: "Navigation",
    description: "Tabbed sections.",
    examples: [{ title: "Tabs", file: "tabs/demo", component: TabsDemo }],
    usage: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="activity">
  <TabsList aria-label="Agent">
    <TabsTrigger value="activity">Activity</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="activity">…</TabsContent>
  <TabsContent value="settings">…</TabsContent>
</Tabs>`,
    props: baseProps("@base-ui/react Tabs"),
    security: { sinks: [], notes: ["Arrow keys move between tabs."] },
    accessibility: {
      keyboard: [["← →", "Moves between tabs and shows each one."], ["Home / End", "First and last tab."], ["Tab", "Leaves the tab list for the panel."]],
      notes: ["tablist, tab and tabpanel roles with aria-selected and aria-controls; name the list with aria-label."],
      motion: "The selected tab's background and color change in 200 ms.",
    },
  },
  {
    name: "textarea",
    title: "Textarea",
    category: "Forms",
    description: "Multi-line text input.",
    examples: [{ title: "Textarea", file: "textarea/demo", component: TextareaDemo }],
    usage: `import { Textarea } from "@/components/ui/textarea";

<Textarea aria-label="Note" maxLength={1000} />`,
    props: [
      { name: "maxLength", type: "number", default: "4000", description: "Length limit; match it to the server's." },
      { name: "...props", type: "textarea props", description: "Every prop of the native textarea." },
    ],
    security: {
      sinks: ["Input"],
      defenses: [
        {
          title: "Bounded by default",
          text: "Limited to 4000 characters; set maxLength to the server's limit so people see it before submitting.",
          evidence: [["primitives.test.tsx", "text fields are bounded by default and the limit can be changed, not removed"]],
          ids: ["CWE-770", "CWE-20"],
        },
      ],
      backend: "validate the text again on the server with the same limit.",
    },
    accessibility: {
      notes: ["Give it a Label or an aria-label.", "The browser stops typing at maxLength (4000 by default); say the limit in the label or a hint if people may reach it."],
    },
  },
  {
    name: "tooltip",
    title: "Tooltip",
    category: "Overlays",
    description: "Short hint on hover or focus.",
    examples: [{ title: "Tooltip", file: "tooltip/demo", component: TooltipDemo }],
    usage: `import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

<Tooltip>
  <TooltipTrigger render={<Button variant="outline" />}>Ceiling</TooltipTrigger>
  <TooltipContent>The most this agent can cost per day.</TooltipContent>
</Tooltip>`,
    props: baseProps("@base-ui/react Tooltip"),
    security: { sinks: [], notes: ["Never put essential information only in a tooltip; it is not available on touch devices."] },
    accessibility: {
      keyboard: [["Tab", "Focusing the trigger shows the tooltip."], ["Esc", "Hides it."]],
      notes: ["The tooltip describes its trigger; it is not shown on touch, so never put the only copy of information in it."],
      motion: "It materializes after a 300 ms delay and fades out in 200 ms. With reduced motion it only fades.",
    },
  },
  {
    name: "field",
    title: "Field",
    category: "Forms",
    description: "A form field: label, control, hint and an error that shows inline, plus a honeypot spam trap.",
    examples: [
      { title: "Field", description: "Type a wrong email and move on: the error shows at once. Send checks every field, empty ones too.", file: "field/demo", component: FieldDemo },
      { title: "Errors from the server", description: "A failed secureAction result names its invalid fields; pass them as errors.", file: "field/server-errors", component: FieldServerErrors },
    ],
    usage: `import { Field, FieldControl, FieldDescription, FieldError, FieldLabel, Form, Honeypot } from "@/components/ui/field";

<Form onFormSubmit={send}>
  <Field name="email" errors={result?.fields}>
    <FieldLabel>Email</FieldLabel>
    <FieldControl type="email" required maxLength={254} />
    <FieldDescription>We answer within one working day.</FieldDescription>
    <FieldError>Enter an email like name@studio.com.</FieldError>
  </Field>
  <Honeypot />
</Form>`,
    props: [
      { name: "name", type: "string", description: "The field's name in the form, and the key looked up in errors." },
      { name: "errors", type: "readonly string[]", description: "The fields of a failed secureAction result. The field is invalid while its name is in the list." },
      { name: "invalid", type: "boolean", description: "Marks the field invalid from outside; its FieldError shows." },
      { name: "validationMode", type: "\"onBlur\" | \"onChange\" | \"onSubmit\"", default: "\"onBlur\"", description: "When the field checks itself. On blur, a mistake shows before the form is sent." },
      { name: "...props", type: "@base-ui/react Field.Root props", description: "Every prop of the Base UI part, including validate for custom rules." },
    ],
    parts: [
      { name: "FieldControl", description: "The control, labelled and described by the field. An Input unless render says otherwise.", props: [{ name: "render", type: "ReactElement", default: "<Input />", description: "Another control, e.g. <Textarea />." }] },
      { name: "FieldError", description: "Shown while the field is invalid, inside a polite live region.", props: [{ name: "children", type: "ReactNode", description: "The message. Without it, the browser's own message shows." }] },
      { name: "Form", description: "Checks every field on submit and focuses the first invalid one.", props: [{ name: "onFormSubmit", type: "(values) => void", description: "Runs only when every field is valid, with the values by name." }] },
      { name: "Honeypot", description: "A text field people never see, hear or reach; bots fill it in.", props: [{ name: "name", type: "string", default: "\"website\"", description: "Reject the submit on the server when this field is not empty." }] },
    ],
    security: {
      sinks: ["Input"],
      defenses: [
        {
          title: "A trap only bots fall into",
          text: "Honeypot is hidden from assistive technology, out of the tab order and off screen, and is sent empty by people.",
          evidence: [["field.test.tsx", "keeps the honeypot away from people: hidden from assistive tech, out of the tab order, sent empty"]],
          ids: ["CWE-799", "OWASP A04:2021"],
        },
      ],
      backend: "reject a submit whose honeypot is not empty and validate every field again; client checks are a convenience.",
    },
    accessibility: {
      keyboard: [["Tab", "Leaving a field you typed in checks it and shows its error."], ["Enter", "In a text field, sends the form; the first invalid field takes the focus."]],
      notes: [
        "The label names the control; the description and the error describe it (aria-describedby), and aria-invalid marks it.",
        "Errors render in a polite live region that is always present, so they are announced when they appear.",
        "Honeypot is aria-hidden with tabindex=-1, so no person reaches it.",
      ],
      motion: "Nothing moves.",
    },
  },
  {
    name: "fieldset",
    title: "Fieldset",
    category: "Forms",
    description: "A group of fields or choices named by its legend.",
    examples: [{ title: "Fieldset", file: "fieldset/demo", component: FieldsetDemo }],
    usage: `import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Fieldset, FieldsetLegend } from "@/components/ui/fieldset";

<Fieldset>
  <FieldsetLegend>What do you need?</FieldsetLegend>
  <Field>
    <FieldLabel><Checkbox name="needs" value="web" /> Website</FieldLabel>
  </Field>
</Fieldset>`,
    props: [
      { name: "disabled", type: "boolean", description: "Disables every control in the group." },
      { name: "...props", type: "@base-ui/react Fieldset.Root props", description: "Every prop of the Base UI part." },
    ],
    security: { sinks: [], notes: ["Structure only: it renders what it is given as children."] },
    accessibility: {
      notes: ["A group named by its legend, so a screen reader says the group's name before each choice in it."],
      motion: "Nothing moves.",
    },
  },
  {
    name: "select",
    title: "Select",
    category: "Forms",
    description: "Chooses one option from a short list, with groups and disabled options.",
    examples: [{ title: "Select", file: "select/demo", component: SelectDemo }],
    usage: `import { Field, FieldLabel } from "@/components/ui/field";
import { Select } from "@/components/ui/select";

<Field name="proposal">
  <FieldLabel>Proposal</FieldLabel>
  <Select
    placeholder="Choose a proposal"
    options={[{ label: "Open", options: [{ value: "p-12", label: "Ceramics studio identity" }] }]}
  />
</Field>`,
    props: [
      { name: "options", type: "(SelectOption | SelectOptionGroup)[]", description: "{ value, label, disabled? } or { label, options } for a group. Labels are strings, so they always render as text." },
      { name: "placeholder", type: "string", description: "Shown while nothing is chosen." },
      { name: "value / defaultValue", type: "string | null", description: "The chosen option's value." },
      { name: "onValueChange", type: "(value: string | null) => void", description: "Runs when a person picks an option." },
      { name: "aria-label", type: "string", description: "Names the trigger when it is not in a Field with a FieldLabel." },
      { name: "...props", type: "@base-ui/react Select.Root props", description: "name, required, disabled and the rest of the Base UI root." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "Labels are text",
          text: "Options take their label as a string, so a label holding markup shows the characters and never becomes elements.",
          evidence: [["select.test.tsx", "renders any label as text, never as markup (property)"]],
          ids: ["CWE-79"],
        },
      ],
      backend: "accept only the values you offered; the submitted value is a string the client chose.",
    },
    accessibility: {
      keyboard: [["Enter / Space / ↓", "Opens the list."], ["↑ ↓", "Moves between options, skipping disabled ones."], ["Enter", "Picks the option."], ["Esc", "Closes without changing."]],
      notes: ["The trigger is named by the FieldLabel and marked aria-invalid when the field is invalid.", "Groups are named by their label."],
      motion: "The list materializes in 200 ms. With reduced motion it only fades.",
    },
  },
  {
    name: "combobox",
    title: "Combobox",
    category: "Forms",
    description: "Chooses one option from a longer list by typing to filter it.",
    examples: [{ title: "Combobox", file: "combobox/demo", component: ComboboxDemo }],
    usage: `import { Combobox } from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";

<Field name="sector">
  <FieldLabel>Sector</FieldLabel>
  <Combobox name="sector" options={[{ value: "bakery", label: "Bakery" }]} />
</Field>`,
    props: [
      { name: "options", type: "ComboboxOption[]", description: "{ value, label, disabled? }. Labels are strings, so they always render as text." },
      { name: "value / defaultValue", type: "string | null", description: "The chosen option's value." },
      { name: "onValueChange", type: "(value: string | null) => void", description: "Runs when a person picks an option." },
      { name: "name", type: "string", description: "Sends the chosen option's value, never the typed text." },
      { name: "placeholder", type: "string", description: "Shown in the empty input." },
      { name: "labels", type: "Partial<ComboboxLabels>", description: "Overrides the locale's words (No results, Show options)." },
    ],
    security: {
      sinks: ["Input"],
      defenses: [
        {
          title: "The typed text is never sent",
          text: "The query is limited to 256 characters and only filters the list; the form sends the chosen option's value.",
          evidence: [["select.test.tsx", "filters as you type, says when nothing matches, and sends the chosen value"]],
          ids: ["CWE-20", "CWE-770"],
        },
      ],
      backend: "accept only the values you offered.",
    },
    accessibility: {
      keyboard: [["Type", "Filters the list."], ["↑ ↓", "Moves between matches."], ["Enter", "Picks the highlighted option."], ["Esc", "Closes the list."]],
      notes: ["The input has role=\"combobox\" and is named by the FieldLabel; the list says No results when nothing matches.", "The button that opens the list is named Show options."],
      motion: "The list materializes in 200 ms. With reduced motion it only fades.",
    },
  },
  {
    name: "toggle",
    title: "Toggle",
    category: "Actions",
    description: "A button that stays pressed, e.g. to pin an item.",
    examples: [{ title: "Toggle", file: "toggle/demo", component: ToggleDemo }],
    usage: `import { Toggle } from "@/components/ui/toggle";

<Toggle variant="outline" pressed={pinned} onPressedChange={setPinned}>
  Pin to profile
</Toggle>`,
    props: [
      { name: "pressed / defaultPressed", type: "boolean", description: "Controlled or uncontrolled pressed state." },
      { name: "onPressedChange", type: "(pressed: boolean) => void", description: "Runs when a person presses it." },
      { name: "variant", type: "\"default\" | \"outline\" | \"segmented\"", default: "\"default\"", description: "How it is drawn." },
      { name: "size", type: "\"default\" | \"sm\"", default: "\"default\"", description: "36 or 32 px tall; the target is 44 px either way." },
      { name: "...props", type: "@base-ui/react Toggle props", description: "Every prop of the Base UI part." },
    ],
    security: { sinks: [], notes: ["A button with a state; it renders what it is given as children."] },
    accessibility: {
      keyboard: [["Space / Enter", "Presses or releases it."]],
      notes: ["A button with aria-pressed; give an icon-only toggle an aria-label.", "Pressed is drawn by a heavier outline and a fill, not by color alone.", "The press target is at least 44 × 44 px, even at the small size."],
      motion: "Its fill changes in 200 ms. Nothing moves.",
    },
  },
  {
    name: "toggle-group",
    title: "Toggle Group",
    category: "Actions",
    description: "Pressed buttons that act as one control: chips that choose many, filters that choose one, and a segmented control.",
    examples: [
      { title: "Toggle Group", description: "Choose several with multiple.", file: "toggle-group/demo", component: ToggleGroupDemo },
      { title: "Segmented", description: "Two to six options, one always pressed.", file: "toggle-group/segmented", component: ToggleGroupSegmented },
    ],
    usage: `import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

<ToggleGroup variant="segmented" aria-label="Show" defaultValue={["photos"]}>
  <ToggleGroupItem value="photos">Photos</ToggleGroupItem>
  <ToggleGroupItem value="videos">Videos</ToggleGroupItem>
</ToggleGroup>`,
    props: [
      { name: "multiple", type: "boolean", default: "false", description: "Lets several items be pressed." },
      { name: "value / defaultValue", type: "string[]", description: "The pressed items' values." },
      { name: "onValueChange", type: "(value: string[]) => void", description: "Runs when a person presses or releases an item." },
      { name: "variant", type: "\"default\" | \"outline\" | \"segmented\"", default: "\"default\"", description: "Segmented draws a track and always keeps one item pressed." },
      { name: "orientation", type: "\"horizontal\" | \"vertical\"", default: "\"horizontal\"", description: "Which arrows move between items." },
      { name: "...props", type: "@base-ui/react ToggleGroup props", description: "disabled, loopFocus and the rest of the Base UI part." },
    ],
    parts: [{ name: "ToggleGroupItem", description: "One item; a Toggle with the group's variant and size.", props: [{ name: "value", type: "string", description: "What the group reports when this item is pressed." }] }],
    security: { sinks: [], notes: ["Buttons with a state; they render what they are given as children."] },
    accessibility: {
      keyboard: [["Tab", "Enters the group once, on the pressed or first item."], ["← → (↑ ↓ when vertical)", "Moves between items."], ["Space / Enter", "Presses or releases the item."]],
      notes: ["role=\"group\": name it with aria-label or aria-labelledby. Each item is a button with aria-pressed.", "Pressed is drawn by a heavier outline as well as a fill; every item has a 44 px target."],
      motion: "The pressed fill changes in 200 ms. Nothing moves.",
    },
  },
  {
    name: "copy-button",
    title: "Copy Button",
    category: "Actions",
    description: "Copies a string, e.g. a share link, and confirms it.",
    examples: [{ title: "Copy Button", description: "Where the browser refuses to copy, the link shows selected beside the button.", file: "copy-button/demo", component: CopyButtonDemo }],
    usage: `import { CopyButton } from "@/components/ui/copy-button";

<CopyButton value={portfolioUrl}>Copy link</CopyButton>`,
    props: [
      { name: "value", type: "string", description: "The exact text to copy." },
      { name: "onCopied", type: "() => void", description: "Runs after the text is on the clipboard." },
      { name: "labels", type: "Partial<CopyButtonLabels>", description: "Overrides the locale's words (Copy, Copied, the fallback hint)." },
      { name: "...props", type: "ButtonProps", default: "variant=\"outline\"", description: "Every Button prop. size=\"icon\" shows the icon only and is named Copy." },
    ],
    security: {
      sinks: [],
      notes: ["It only writes the given string with navigator.clipboard.writeText; it never reads the clipboard."],
    },
    accessibility: {
      keyboard: [["Enter / Space", "Copies."], ["Ctrl+C / ⌘C", "Where copying is blocked, copies the selected text that takes the focus."]],
      notes: ["Copied is announced politely by a status region and shown on the button for 2 s.", "Where the browser refuses, the text shows in a read-only field, selected and focused, and the status says so."],
      motion: "The icon changes to a check for 2 s. Nothing moves.",
    },
  },
  {
    name: "media-frame",
    title: "Media Frame",
    category: "Data display",
    description: "A frame with a fixed aspect ratio for work thumbnails, with a labelled placeholder while media is missing.",
    examples: [{ title: "Media Frame", description: "The third frame has no media yet; a frame whose image fails to load shows the same placeholder.", file: "media-frame/demo", component: MediaFrameDemo }],
    usage: `import { MediaFrame } from "@/components/ui/media-frame";

<MediaFrame ratio="4:5" src="/work/shop-sign.jpg" alt="Ceramics studio identity, the shop sign" />
<MediaFrame ratio="16:9" alt="Hotel campaign" caption="Photos coming soon" />`,
    props: [
      { name: "ratio", type: "\"1:1\" | \"4:5\" | \"3:2\" | \"16:9\" | \"21:9\"", default: "\"3:2\"", description: "The shape kept before the media loads, so nothing below it moves." },
      { name: "fit", type: "\"cover\" | \"contain\"", default: "\"cover\"", description: "How the media fills the frame." },
      { name: "alt", type: "string", description: "Required, unless decorative is set; then the image gets an empty alt." },
      { name: "decorative", type: "true", description: "Marks the media as decoration: empty alt, placeholder hidden from assistive technology." },
      { name: "src", type: "string", description: "Without it, or when it fails, the placeholder shows. Same-origin, or an origin the CSP img-src allows." },
      { name: "caption", type: "string", description: "Shown in the placeholder." },
      { name: "image", type: "(props: MediaImageProps) => ReactNode", default: "a plain img", description: "Renders the image with a framework component, e.g. next/image with fill." },
    ],
    security: {
      sinks: [],
      notes: ["Remote images load only from origins the CSP img-src (securityHeaders imgSrc) and the framework's image allowlist name; the frame adds none."],
    },
    accessibility: {
      notes: [
        "alt is required by the type; an empty alt only with decorative.",
        "The placeholder is role=\"img\" named by the alt and the caption, so a missing picture is still announced.",
      ],
      motion: "Nothing moves; the reserved ratio keeps the layout still while the image loads.",
    },
  },
  {
    name: "carousel",
    title: "Carousel",
    category: "Data display",
    description: "A gallery that moves one slide at a time, and a cross-fading Slideshow. Autoplay is off unless asked for.",
    examples: [
      { title: "Carousel", description: "Previous and next, or swipe on touch. Two slides at a time from the small breakpoint.", file: "carousel/demo", component: CarouselDemo },
      { title: "Slideshow with autoplay", description: "One frame at a time. Autoplay holds while the pointer or the focus is on it, and never runs with reduced motion.", file: "carousel/slideshow", component: CarouselSlideshow },
    ],
    usage: `import { Carousel, Slideshow } from "@/components/ui/carousel";

<Carousel label="Selected work">
  {works.map((w) => <MediaFrame key={w.id} ratio="4:5" src={w.src} alt={w.alt} />)}
</Carousel>

<Slideshow label="Showreel" autoplay interval={6000} className="h-screen">
  {frames}
</Slideshow>`,
    props: [
      { name: "label", type: "string", description: "Names the carousel for assistive technology." },
      { name: "children", type: "ReactNode", description: "One child per slide." },
      { name: "autoplay", type: "boolean", default: "false", description: "Advances on its own, with a pause button first in the tab order and a progress bar." },
      { name: "interval", type: "number", default: "5000 (Slideshow 6000)", description: "Milliseconds per slide while autoplay runs." },
      { name: "slideClassName", type: "string", description: "Classes for each slide, e.g. a basis to show two at a time." },
      { name: "labels", type: "Partial<CarouselLabels>", description: "Overrides the locale's words (Previous slide, Next slide, Pause, Play, n of m)." },
    ],
    parts: [{ name: "Slideshow", description: "One slide at a time, cross-faded; fills its container. Same props.", props: [{ name: "className", type: "string", description: "Give it a height, e.g. h-screen for a background." }] }],
    security: { sinks: [], notes: ["Renders the slides it is given; it loads nothing by itself."] },
    accessibility: {
      keyboard: [["Tab", "Reaches Pause (with autoplay), then Previous and Next, then the visible slide."], ["Enter / Space", "On a button: pauses, plays or moves."]],
      notes: [
        "A region with aria-roledescription=\"carousel\" and its label; each slide is a group named \"n of m\". Slides out of view are inert.",
        "Moves are announced politely while autoplay is off or paused, and not while it runs.",
        "With autoplay, the pause button is visible and first (WCAG 2.2.2). Autoplay holds on hover and focus, stops while the tab is hidden, and never runs with reduced motion.",
      ],
      motion: "Carousel scrolls smoothly and Slideshow cross-fades in 900 ms. With reduced motion the scroll jumps, the fade takes 200 ms and nothing plays on its own.",
    },
  },
  {
    name: "video",
    title: "Video",
    category: "Data display",
    description: "A video player with captions, and a muted background video. Nothing loads until it is near, and nothing plays on its own unless asked.",
    examples: [
      { title: "Video", description: "Poster, the browser's controls and English captions. The file loads only when the player is near the viewport.", file: "video/demo", component: VideoDemo },
      { title: "Background video", description: "Muted and looped behind content, with a pause button while it moves. Autoplay is on here; with reduced motion it stays on the poster.", file: "video/background", component: VideoBackground },
    ],
    usage: `import { Video } from "@/components/ui/video";

<Video src="/films/showreel.mp4" type="video/mp4" poster="/films/showreel.jpg" title="Showreel 2026"
  captions={[{ src: "/films/showreel.en.vtt", srclang: "en", label: "English", default: true }]} />

<Video variant="background" autoplay src="/films/loop.mp4" title="Studio loop" />`,
    props: [
      { name: "src", type: "string", description: "A file on this origin or one the CSP media-src allows (securityHeaders mediaSrc). No third-party embeds." },
      { name: "type", type: "string", description: "The file's type, e.g. \"video/mp4\"." },
      { name: "poster", type: "string", description: "Shown before it plays." },
      { name: "title", type: "string", description: "Names the player. A background video is hidden from assistive technology." },
      { name: "captions", type: "{ src, srclang, label, default? }[]", description: "Caption tracks (WebVTT)." },
      { name: "variant", type: "\"player\" | \"background\"", default: "\"player\"", description: "Background: muted, looped, inline, no controls, a pause button; fills its container." },
      { name: "autoplay", type: "boolean", default: "false", description: "Starts muted once in view. Never under reduced motion." },
      { name: "labels", type: "Partial<VideoLabels>", description: "Overrides the locale's words (Play video, Pause video)." },
    ],
    security: {
      sinks: [],
      notes: ["Plays files from origins the CSP media-src allows; pass mediaSrc to securityHeaders for a media CDN. It never embeds a third-party player."],
    },
    accessibility: {
      keyboard: [["Tab", "Reaches the player's controls, or the background video's pause button."], ["Space / Enter", "Plays or pauses."]],
      notes: [
        "The player is named by title and carries caption tracks.",
        "A background video is aria-hidden; its pause button is always there while it moves (WCAG 2.2.2).",
        "Autoplay is off by default, always muted, and never runs with reduced motion.",
      ],
      motion: "The video moves only when the person plays it, or when autoplay is asked for and reduced motion is off.",
    },
  },
  {
    name: "lightbox",
    title: "Lightbox",
    category: "Overlays",
    description: "Thumbnails that open full screen on a Dialog, with previous, next, a counter and a caption.",
    examples: [{ title: "Lightbox", description: "Open a work, move with ← →, close with Esc: the focus goes back to its thumbnail. Here the image grows from the thumbnail.", file: "lightbox/demo", component: LightboxDemo }],
    usage: `import { Lightbox } from "@/components/ui/lightbox";

<Lightbox
  items={[{ src: "/work/shop-sign.jpg", alt: "Shop sign in terracotta", title: "Ceramics studio", caption: "Identity, 2026" }]}
/>`,
    props: [
      { name: "items", type: "{ src, alt, title, caption? }[]", description: "The works; title names the open dialog." },
      { name: "ratio", type: "MediaRatio", default: "\"4:5\"", description: "Shape of the thumbnails (a MediaFrame each)." },
      { name: "zoomFromThumbnail", type: "boolean", default: "false", description: "The opened image grows from its thumbnail. Never with reduced motion." },
      { name: "className", type: "string", description: "Classes for the grid of thumbnails." },
      { name: "labels", type: "Partial<LightboxLabels>", description: "Overrides the locale's words (Previous, Next, Close, n of m)." },
    ],
    security: { sinks: [], notes: ["Images load from the origins the CSP img-src allows; titles and captions are text."] },
    accessibility: {
      keyboard: [["Enter / Space", "On a thumbnail, opens it."], ["← →", "Previous and next item."], ["Esc", "Closes; the focus goes back to the thumbnail that opened it."], ["Tab", "Stays inside while it is open."]],
      notes: ["A dialog named by the item's title; the counter is a polite live region, so moving says \"2 of 4\".", "Each thumbnail is a button named by its image's alt."],
      motion: "The dialog materializes; with zoomFromThumbnail the image grows from its thumbnail in 380 ms. With reduced motion neither moves.",
    },
  },
  {
    name: "scroll-motion",
    title: "Scroll Motion",
    category: "Foundations",
    description: "Reveal, Parallax and Pin: scroll motion with no animation library, off under reduced motion.",
    examples: [
      { title: "Reveal and parallax", description: "Scroll the page: the steps fade in as they enter, and the poster drifts against the scroll.", file: "scroll-motion/demo", component: ScrollMotionDemo, align: "start" },
      { title: "Pin", description: "The section holds while the page scrolls past it; its children get the progress from 0 to 1.", file: "scroll-motion/pin", component: ScrollMotionPin, align: "start" },
      { title: "Pin on wide screens, with scrollTo", description: "Pinned only at 768 px and wider; the room buttons scroll the page to that progress of the pin.", file: "scroll-motion/pin-media", component: ScrollMotionPinMedia, align: "start" },
    ],
    usage: `import { Parallax, Pin, Reveal } from "@/components/ui/scroll-motion";

<Reveal><h2>Selected work</h2></Reveal>
<Parallax distance={40}><MediaFrame ratio="16:9" src={poster} alt="Hotel campaign poster" /></Parallax>
<Pin length={1.5}>{(progress) => <Steps current={Math.floor(progress * 3)} />}</Pin>`,
    props: [{ name: "...props", type: "div props", description: "Reveal takes any div props." }],
    parts: [
      { name: "Parallax", description: "Drifts its content against the scroll; only transform moves. To crop it, wrap it in overflow-clip, not overflow-hidden: a hidden overflow is a scroll container and holds it still.", props: [{ name: "distance", type: "number", default: "40", description: "Pixels, from +distance as it enters to −distance as it leaves." }] },
      {
        name: "Pin",
        description: "Holds its content while the page scrolls past it.",
        props: [
          { name: "length", type: "number", default: "1.5", description: "How long it stays pinned, in viewport heights." },
          { name: "children", type: "ReactNode | (progress: number) => ReactNode", description: "The content, or a function of the progress from 0 to 1. usePinProgress() reads it deeper down." },
          { name: "media", type: "string", description: "Pins only where this media query matches; elsewhere a plain section. Reduced motion still wins." },
          { name: "onPinnedChange", type: "(pinned: boolean) => void", description: "Runs when it starts or stops pinning; usePinned() reads the same deeper down." },
          { name: "ref", type: "Ref<PinHandle>", description: "scrollTo(progress, { behavior }) scrolls the page to that progress of the pin; always instant under reduced motion." },
        ],
      },
    ],
    security: { sinks: [], notes: ["No dependency: IntersectionObserver, scroll-driven animations (ViewTimeline) or requestAnimationFrame. Nothing is injected; it sets only transform and opacity."] },
    accessibility: {
      notes: [
        "The content is in the HTML and visible without JavaScript; motion only reveals it. Content already in view never moves.",
        "Pin renders a plain section on the server and pins after mount, so a page without JavaScript reads it in full.",
        "Under reduced motion nothing moves: Reveal shows at once, Parallax stays put, Pin is a plain section at progress 1.",
      ],
      motion: "Reveal fades and lifts 24 px in 900 ms. Parallax drifts by its distance across the viewport. Only transform and opacity animate, and will-change is set only while they move.",
    },
  },
  {
    name: "custom-theme",
    title: "Custom theme",
    category: "Foundations",
    description: "A theme as typed data: colors, radius, blur, shadow, motion, type and the sans, display and mono fonts.",
    examples: [{ title: "Theme fonts", description: "Pick a preset or name a self-hosted family; the same validator as aedis theme import writes the variables, or says why it refused.", file: "custom-theme/fonts", component: CustomThemeFonts }],
    usage: `// rlfn-theme.json, then: npx @aedis/cli theme import rlfn-theme.json
{
  "version": 1,
  "name": "RLFN Studio",
  "colors": { "light": {}, "dark": {} },
  "fonts": { "sans": "Brand Sans", "display": "Fraunces", "mono": "mono" }
}

/* Your CSS: self-host every family the theme names (font-src 'self'). */
@font-face { font-family: "Fraunces"; src: url("/fonts/fraunces.woff2") format("woff2"); font-display: swap; }`,
    props: [
      { name: "fonts.sans", type: "string", description: "Body text. A preset (system, rounded, serif, mono) or a self-hosted family name." },
      { name: "fonts.display", type: "string", description: "h1–h3 and the font-display class. Defaults to the sans." },
      { name: "fonts.mono", type: "string", description: "Code. A preset or a self-hosted family name." },
      { name: "font", type: "\"system\" | \"rounded\" | \"serif\" | \"mono\"", description: "The sans alone, as before; fonts.sans wins over it." },
    ],
    security: {
      sinks: ["DOM"],
      defenses: [
        {
          title: "A font name cannot become CSS",
          text: "A family is letters, digits, spaces and hyphens, quoted ahead of the system fallback: it cannot close the rule, import a stylesheet or reach a url().",
          evidence: [["custom-theme.test.ts", "never lets a font name close the quotes, the rule or reach a url (property, #202)"]],
          ids: ["CWE-79", "CWE-94"],
        },
      ],
      backend: "self-host the font files and declare them with @font-face in your CSS: font-src 'self' allows them. A font CDN needs securityHeaders({ fontSrc }); never link remote font CSS.",
    },
    accessibility: {
      notes: ["Fonts change families only: the contrast and type size checks of the theme are unchanged.", "Use font-display: swap so text shows in the fallback while the font loads."],
    },
  },
  {
    name: "abuse-gate",
    title: "abuseGate",
    category: "Security",
    description: "A sliding-window limit per target (an HMAC of the contact) and per IP, for public forms. Stores no personal data.",
    examples: [{ title: "Simulator", description: "The real gate in your browser, with a clock you can move: 3 submits per contact in 10 minutes, 5 per IP.", file: "abuse-gate/simulator", component: AbuseGateSimulator }],
    usage: `import { abuseGate } from "@/lib/abuse-gate";

const gate = abuseGate({ secret: process.env.ABUSE_SECRET!, limit: 5, windowMs: 3_600_000, ipLimit: 20, cache: redisCache });

// In the contact Server Action or route handler, before sending:
const verdict = await gate.check({ target: [input.email, input.company], ip: clientIp(request) });
if (!verdict.ok) return { ok: false, code: "rate-limited" };`,
    props: [
      { name: "secret", type: "string", description: "At least 32 characters, from the server's secrets. Keys are HMAC-SHA-256 of the normalized target." },
      { name: "limit / windowMs", type: "number", default: "5 / 1 h", description: "Submits per target in the sliding window." },
      { name: "ipLimit / ipWindowMs", type: "number", default: "20 / windowMs", description: "Submits per IP, whatever the target." },
      { name: "cache", type: "AbuseCache", default: "memoryCache()", description: "get, set with a TTL, delete. Back it with Redis, KV or a table in production." },
      { name: "now", type: "() => number", default: "Date.now", description: "The clock; tests pass a fake one." },
      { name: "check({ target, ip })", type: "Promise<{ ok: true } | { ok: false; reason; retryAfterMs }>", description: "Counts the submit when it is allowed; a refused one is not counted." },
    ],
    security: {
      sinks: ["Input"],
      defenses: [
        {
          title: "No personal data in the store",
          text: "The email, company and IP become an HMAC-SHA-256 with the server's secret before anything is stored; the in-memory cache is bounded.",
          evidence: [["abuse.test.ts", "stores only HMACs, never the email, company or IP"], ["abuse.test.ts", "keeps the in-memory cache bounded and expires entries"]],
          ids: ["CWE-359", "CWE-770"],
        },
        {
          title: "A limit per target and per IP",
          text: "Rotating IPs does not reset a contact's window, and one IP cannot spray many contacts.",
          evidence: [["abuse.test.ts", "allows `limit` submits per target in a sliding window, and does not count refused ones"], ["abuse.test.ts", "caps an IP across targets"]],
          ids: ["CWE-799", "OWASP A04:2021"],
        },
      ],
      backend: "it runs on the server only; keep the secret there, use a shared cache across instances, and take the IP from your trusted proxy header.",
    },
  },
  {
    name: "brute-force-guard",
    title: "bruteForceGuard",
    category: "Security",
    description: "Progressive lockouts after repeated failures: 1 minute, then 15 minutes, then 1 hour.",
    examples: [{ title: "Simulator", description: "Three wrong passwords lock the account; move the clock to see the next lockout grow.", file: "brute-force-guard/simulator", component: BruteForceGuardSimulator }],
    usage: `import { bruteForceGuard } from "@/lib/brute-force-guard";

const guard = bruteForceGuard({ secret: process.env.ABUSE_SECRET!, cache: redisCache });

const locked = await guard.check([email]);
if (!locked.ok) return { ok: false, code: "rate-limited" };
if (await passwordMatches(email, password)) await guard.succeed([email]);
else await guard.fail([email]);`,
    props: [
      { name: "secret", type: "string", description: "At least 32 characters; the subject is stored as an HMAC." },
      { name: "maxFailures", type: "number", default: "5", description: "Failures before the next lockout." },
      { name: "steps", type: "number[]", default: "[1 min, 15 min, 1 h]", description: "One lockout per step; the last repeats." },
      { name: "resetMs", type: "number", default: "24 h", description: "A subject with no failure for this long starts over." },
      { name: "check / fail / succeed", type: "(subject: string[]) => Promise", description: "Check before trying, then report the outcome." },
    ],
    security: {
      sinks: ["Session"],
      defenses: [
        {
          title: "Lockouts that grow",
          text: "Each run of failures locks longer: 1 minute, 15 minutes, then 1 hour; a success clears the record.",
          evidence: [["abuse.test.ts", "locks for 1 min, then 15 min, then 1 h, and a success starts over"]],
          ids: ["CWE-307", "OWASP A07:2021", "ATT&CK T1110"],
        },
      ],
      backend: "say the same thing for a wrong password and an unknown account, and key the subject by account (and IP if you want both).",
    },
  },
  {
    name: "form-token",
    title: "Form token",
    category: "Security",
    description: "An HMAC-signed issued-at in a hidden field: refuses submits faster than 3 seconds, older than 1 hour, or forged.",
    examples: [{ title: "Simulator", description: "Render the form, then send it at once, after 5 seconds, after an hour, or with a forged time.", file: "form-token/simulator", component: FormTokenSimulator }],
    usage: `import { issueFormToken, verifyFormToken } from "@/lib/form-token";

// When the form renders (a Server Component):
<input type="hidden" name="token" value={await issueFormToken(process.env.ABUSE_SECRET!, { form: "contact" })} />

// When it is sent:
const token = await verifyFormToken(process.env.ABUSE_SECRET!, formData.get("token"), { form: "contact" });
if (!token.ok) return { ok: false, code: "invalid" };`,
    props: [
      { name: "issueFormToken(secret, { form, now })", type: "Promise<string>", description: "v1.<issuedAt>.<HMAC>: no personal data." },
      { name: "verifyFormToken(secret, token, { form, now, minAgeMs, maxAgeMs })", type: "Promise<FormTokenResult>", description: "ok with its age, or malformed, signature, too-fast or expired. 3 s and 1 h by default." },
    ],
    security: {
      sinks: ["Input"],
      defenses: [
        {
          title: "A time the client cannot forge",
          text: "The issued-at is signed with the server's secret and the form's name and checked with crypto.subtle.verify; any changed character is refused.",
          evidence: [["abuse.test.ts", "never accepts a token with any character changed (property)"], ["abuse.test.ts", "refuses another form's token, another secret's, and anything malformed"]],
          ids: ["CWE-345", "CWE-799"],
        },
        {
          title: "Too fast or too old",
          text: "A submit under 3 seconds after rendering is a bot; one over an hour old is a replay.",
          evidence: [["abuse.test.ts", "accepts a submit between 3 s and 1 h after the form was signed"]],
          ids: ["CWE-294"],
        },
      ],
      backend: "sign and verify on the server only, and pair it with the Honeypot field and abuseGate.",
    },
  },
  {
    name: "redact",
    title: "redact",
    category: "AI and agents",
    description: "Hides secrets in tool arguments and logs: values under secret keys, bearer tokens, JWTs and key=value secrets.",
    examples: [{ title: "Inspector", description: "Edit the arguments: secrets are replaced before anything is shown.", file: "redact/inspector", component: RedactInspector }],
    usage: `import { redact, redactText } from "@/lib/redact";

<pre>{JSON.stringify(redact(toolCall.arguments), null, 2)}</pre>
log(redactText(error.message));`,
    props: [
      { name: "redact(value, options)", type: "unknown", description: "A copy with secret values replaced; strings, depth and items bounded, cycles cut." },
      { name: "redactText(text, keys)", type: "string", description: "The text with bearer tokens, JWTs and key=value secrets replaced." },
    ],
    security: { sinks: [], notes: ["It hides what is shown, not what is stored: keep secrets out of tool arguments on the server too."] },
  },
  {
    name: "use-stick-to-bottom",
    title: "useStickToBottom",
    category: "Foundations",
    description: "Keeps a scrolling log at its end while the reader is there, never scrolls the page, and offers a way back.",
    examples: [{ title: "Following a log", description: "Add events at the end; scroll up and the log stays where you are reading.", file: "use-stick-to-bottom/demo", component: UseStickToBottomDemo }],
    usage: `import { useStickToBottom } from "@/hooks/use-stick-to-bottom";

const { ref, atBottom, jump } = useStickToBottom<HTMLDivElement>();
<div ref={ref} role="log" className="overflow-y-auto">{messages}</div>
{!atBottom && <Button onClick={jump}>Jump to latest</Button>}`,
    props: [
      { name: "ref", type: "RefObject<T>", description: "Put it on the element that scrolls." },
      { name: "atBottom", type: "boolean", description: "Whether the reader is at the end." },
      { name: "jump", type: "() => void", description: "Back to the end, following again." },
    ],
    security: { sinks: [], notes: ["Layout only: it scrolls the log it is given and nothing else."] },
    accessibility: { notes: ["It never moves the page around the log, and never pulls the reader away from what they scrolled back to."] },
  },
  {
    name: "mf-embed-headers",
    title: "Embedding headers",
    category: "Micro-frontends",
    description: "The framing headers of each side: the host may frame only the embedded app, and the embedded app may be framed only by the host.",
    examples: [{ title: "Builder", description: "Give the two origins and read the framing rules each side sends; a wildcard is never produced.", file: "mf-embed-headers/builder", component: MfEmbedHeadersBuilder }],
    usage: `import { embeddedAppHeaders, hostAppHeaders } from "@/lib/mf-embed-headers";

headers: hostAppHeaders({ nonce, frameOrigins: [process.env.AGENT_ORIGIN!] })          // host
headers: embeddedAppHeaders({ nonce, hostOrigins: [process.env.BACKOFFICE_ORIGIN!] })  // embedded app`,
    props: [
      { name: "hostAppHeaders({ frameOrigins, ...securityHeaders options })", type: "Record<string, string>", description: "frame-src only for the embedded apps." },
      { name: "embeddedAppHeaders({ hostOrigins, ...securityHeaders options })", type: "Record<string, string>", description: "frame-ancestors only for the hosts." },
    ],
    security: { sinks: [], notes: ["Origins come from configuration and pass the same exact-origin check as securityHeaders: a wildcard or path is dropped."] },
  },
  {
    name: "attachment",
    title: "Attachments",
    category: "AI and agents",
    description: "Checks a file against an allow-list and a size before upload, makes its name safe to show, and uploads it with progress.",
    examples: [{ title: "Checker", description: "Choose files: each one is checked before anything leaves the page.", file: "attachment/checker", component: AttachmentChecker }],
    usage: `import { checkAttachment, safeFileName, uploadAttachment } from "@/lib/attachment";

const problem = checkAttachment(file, { accept: ["image/png", "application/pdf"], maxBytes: 10_000_000 });
if (!problem) await uploadAttachment("/api/attachments", file, { onProgress: setProgress });`,
    props: [
      { name: "checkAttachment(file, rules)", type: "\"type\" | \"size\" | \"empty\" | null", description: "Why the file is refused, or null." },
      { name: "safeFileName(name, max)", type: "string", description: "Without bidi and control characters, bounded." },
      { name: "uploadAttachment(path, file, options)", type: "Promise<{ id }>", description: "Same-origin path only, with progress; a redirect is refused." },
    ],
    security: { sinks: [], notes: ["The browser's check is a convenience: the server checks type, size and content again."] },
  },
  {
    name: "reasoning",
    title: "Reasoning",
    category: "AI and agents",
    description: "The agent's reasoning, collapsed until asked for, with its secrets redacted.",
    examples: [{ title: "Reasoning", description: "Open it while it thinks; a key in the tool output is redacted.", file: "reasoning/demo", component: ReasoningDemo }],
    usage: `import { Reasoning } from "@/components/ui/reasoning";

<Reasoning streaming={!done} durationMs={elapsed}>{reasoningText}</Reasoning>`,
    props: [
      { name: "children", type: "string", description: "The reasoning, as untrusted markdown; redacted like tool output." },
      { name: "streaming", type: "boolean", description: "Still thinking: the label pulses, still under reduced motion." },
      { name: "durationMs", type: "number", description: "How long it thought, for the label once done." },
    ],
    security: { sinks: [], notes: ["Rendered as safe markdown after redactText: no HTML, no secrets."] },
    accessibility: {
      keyboard: [["Enter / Space", "Opens and closes the reasoning."]],
      notes: ["A disclosure button with aria-expanded; the label says whether it is still thinking."],
      motion: "The label pulses while thinking; with reduced motion it is still.",
    },
  },
];

/** The chart items share their props, security and accessibility; only the drawing differs. */
function chartDocs(): ComponentDoc[] {
  const cartesian: Prop[] = [
    { name: "title", type: "string", description: "Names the chart for assistive technology and captions its data table." },
    { name: "data", type: "Record<string, unknown>[]", description: "Rows as they came. Values that are not finite numbers ≥ 0 are dropped and counted; at most 500 rows." },
    { name: "index", type: "string", description: "The key that names each row: the x axis." },
    { name: "series", type: "{ key: string; label: string; color?: 1 | 2 | 3 | 4 | 5 }[]", description: "What to draw, under which name. Colors are the chart-1…chart-5 tokens only." },
    { name: "indexLabel", type: "string", default: "\"Item\"", description: "Header of the table's first column." },
    { name: "format", type: "(value: number) => string", default: "useFormat().number", description: "How values read in the tooltip and the table." },
    { name: "legend", type: "boolean", default: "series.length > 1", description: "Shows the series names under the chart." },
    { name: "labels", type: "Partial<ChartLabels>", description: "Overrides the locale's words." },
    { name: "animate", type: "boolean", default: "true", description: "Bars grow, lines draw and arcs sweep on enter; values move when data changes. Never under reduced motion." },
  ];
  const security: Security = {
    sinks: ["DOM"],
    defenses: [
      {
        title: "Labels are text",
        text: "Series names, ticks, tooltips and centre labels are text nodes. No prop takes markup, and nothing is set through innerHTML.",
        evidence: [["chart.test.tsx", "render names, ticks, tooltips and the center as text, never as markup"]],
        ids: ["CWE-79", "OWASP LLM05:2025"],
      },
      {
        title: "Numbers are checked",
        text: "Only finite numbers in range are drawn; the rest are dropped, counted and reported under the chart. Rows past 500 are dropped too.",
        evidence: [
          ["chart.test.tsx", "drop and count every value that is not a finite number in range (property)"],
          ["chart.test.tsx", "never draw outside the canvas, whatever the data (property)"],
          ["chart.test.tsx", "say how many values were dropped and cap the rows"],
        ],
        ids: ["CWE-20", "CWE-400"],
      },
    ],
    backend: "aggregate on the server and send only the numbers a chart needs; a chart never decides what someone may see.",
    notes: ["Series colors come from the theme and pass 3:1 against surface and background in every theme (chart.test.tsx)."],
  };
  const accessibility: Accessibility = {
    keyboard: [["Tab", "Focuses the chart."], ["← → / ↑ ↓", "Moves the tooltip through the rows."], ["Home / End", "First or last row."], ["Escape", "Hides the tooltip."]],
    notes: ["The drawing is hidden from assistive technology; a table captioned with the title holds every value.", "The tooltip is text in a polite live region, so keyboard moves are read out."],
    motion: "On enter, bars grow from the baseline with a stagger, lines draw left to right and arcs sweep, on the theme's spring duration and cinematic easing; new values move to their place. With reduced motion, or animate={false}, the final state is drawn at once.",
  };
  const doc = (name: string, title: string, description: string, component: ComponentType, usage: string, props: Prop[] = cartesian, more: ComponentDoc["examples"] = []): ComponentDoc => ({
    name,
    title,
    category: "Charts",
    description,
    examples: [{ title, file: `${name}/demo`, component }, ...more],
    usage,
    props,
    security,
    accessibility,
  });
  return [
    doc("chart", "Chart", "What every chart shares: values checked before drawing, labels as text, a keyboard tooltip, a legend and a data table.", ChartDemo, `import { BarChart } from "@/components/ui/bar-chart";

// A label with markup shows up as characters; NaN and "9" are dropped and counted.
<BarChart title="Runs by agent" data={runs} index="agent" series={[{ key: "runs", label: "Runs" }]} />`),
    doc("area-chart", "Area Chart", "Filled lines, stacked or overlapping, for usage over time.", AreaChartDemo, `import { AreaChart } from "@/components/ui/area-chart";

<AreaChart
  title="Tokens by agent"
  data={tokens}
  index="day"
  stacked
  series={[{ key: "support", label: "Support" }, { key: "reports", label: "Reports" }]}
/>`, [...cartesian, { name: "stacked", type: "boolean", default: "false", description: "Stacks the series, so the top line is the total." }]),
    doc("bar-chart", "Bar Chart", "Bars per row, grouped when there are several series.", BarChartDemo, `import { BarChart } from "@/components/ui/bar-chart";

<BarChart title="Approvals per day" data={approvals} index="day" series={[{ key: "approved", label: "Approved" }]} />`, cartesian, [
      { title: "Many rows", description: "Thirty labels do not fit: the ones that would touch the label before them are left out. Every day is still in the tooltip and the data table.", file: "bar-chart/month", component: BarChartMonth },
    ]),
    doc("line-chart", "Line Chart", "Lines with a dot per value, for latency and trends.", LineChartDemo, `import { LineChart } from "@/components/ui/line-chart";

<LineChart title="Agent latency p95" data={latency} index="day" series={[{ key: "p95", label: "p95" }]} format={(s) => \`\${s.toFixed(1)} s\`} />`),
    doc("pie-chart", "Pie Chart", "A donut of shares, with the total in the middle.", PieChartDemo, `import { PieChart } from "@/components/ui/pie-chart";

<PieChart title="Spend by model" data={spend} index="model" value={{ key: "usd", label: "Spend" }} center="$1,211" />`, [
      ...cartesian.filter((p) => ["title", "data", "index", "format", "labels", "animate"].includes(p.name)),
      { name: "value", type: "{ key: string; label: string }", description: "The key that holds each slice's value, and its name in the tooltip and table." },
      { name: "center", type: "string", description: "Text in the hole, e.g. the total. Text only, cut to 12 characters." },
    ]),
    doc("radial-chart", "Radial Chart", "One value against its maximum, as a ring and a percentage.", RadialChartDemo, `import { RadialChart } from "@/components/ui/radial-chart";

<RadialChart title="Ceiling used" value={1080} max={1500} caption="of $1,500" />`, [
      cartesian[0],
      { name: "value", type: "number", description: "Between 0 and max; anything else is dropped and the ring stays empty." },
      { name: "max", type: "number", description: "A finite number above 0." },
      { name: "caption", type: "string", description: "Under the percentage. Text only, cut to 24 characters." },
      ...cartesian.filter((p) => ["format", "labels", "animate"].includes(p.name)),
    ]),
  ];
}
