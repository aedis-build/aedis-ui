import type { ComponentType, ReactNode } from "react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/registry/aedis/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/registry/aedis/ui/alert";
import { Avatar, AvatarFallback } from "@/registry/aedis/ui/avatar";
import { Badge } from "@/registry/aedis/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/registry/aedis/ui/breadcrumb";
import { Button } from "@/registry/aedis/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/registry/aedis/ui/card";
import { CodeBlock } from "@/registry/aedis/ui/code-block";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/aedis/ui/collapsible";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/registry/aedis/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/registry/aedis/ui/item";
import { Kbd, KbdGroup } from "@/registry/aedis/ui/kbd";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/registry/aedis/ui/pagination";
import { paginationRange } from "@/registry/aedis/lib/pagination";
import { Progress } from "@/registry/aedis/ui/progress";
import { Reasoning } from "@/registry/aedis/ui/reasoning";
import { ChatExample } from "@/components/examples/chat-example";
import ButtonSizes from "@/examples/button/sizes";
import ButtonAsLink from "@/examples/button/as-link";
import ButtonGroupVerticalText from "@/examples/button-group/vertical-text";
import InputStates from "@/examples/input/states";
import ButtonDemo from "@/examples/button/demo";
import ButtonGroupDemo from "@/examples/button-group/demo";
import LinkDemo from "@/examples/link/demo";
import InputDemo from "@/examples/input/demo";
import TextareaDemo from "@/examples/textarea/demo";
import LabelDemo from "@/examples/label/demo";
import CheckboxDemo from "@/examples/checkbox/demo";
import RadioGroupDemo from "@/examples/radio-group/demo";
import SwitchDemo from "@/examples/switch/demo";
import DialogDemo from "@/examples/dialog/demo";
import AlertDialogDemo from "@/examples/alert-dialog/demo";
import SheetDemo from "@/examples/sheet/demo";
import TooltipDemo from "@/examples/tooltip/demo";
import DropdownMenuDemo from "@/examples/dropdown-menu/demo";
import DropdownMenuCheckboxRadio from "@/examples/dropdown-menu/checkbox-radio";
import DropdownMenuSubmenu from "@/examples/dropdown-menu/submenu-disabled";
import CommandDemo from "@/examples/command/demo";
import { ApprovalCardExample, HandRaiseExample } from "@/components/examples/human-in-the-loop-examples";
import { LocaleExample } from "@/components/examples/locale-examples";
import { FeedbackExample } from "@/components/examples/feedback-example";
import { PromptInputExample } from "@/components/examples/prompt-input-example";
import { StreamingExample } from "@/components/examples/streaming-example";
import { ToastExample } from "@/components/examples/toast-example";
import { AppShell } from "@/registry/aedis/ui/app-shell";
import { Markdown } from "@/registry/aedis/ui/markdown";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/registry/aedis/ui/navigation-menu";
import { ScrollArea } from "@/registry/aedis/ui/scroll-area";
import { Separator } from "@/registry/aedis/ui/separator";
import { Sidebar } from "@/registry/aedis/ui/sidebar";
import { SiteFooter } from "@/registry/aedis/ui/site-footer";
import { SiteHeader } from "@/registry/aedis/ui/site-header";
import { Skeleton } from "@/registry/aedis/ui/skeleton";
import { Citation, Sources } from "@/registry/aedis/ui/sources";
import { Spinner } from "@/registry/aedis/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/aedis/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";
import { ToolCall } from "@/registry/aedis/ui/tool-call";

export type Prop = { name: string; type: string; default?: string; description: string };

/** Sidebar and gallery order. */
export const categories = ["Getting started", "Foundations", "Security", "Actions", "Forms", "Overlays", "Navigation", "Feedback", "Data display", "AI and agents", "Transport", "Micro-frontends"] as const;
export type Category = (typeof categories)[number];

/** A file in examples/: rendered in Preview, its source shown in Code. A test checks `component` is that file's export. */
export type Example = { title: string; description?: string; file: string; component: ComponentType };

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

export type ComponentDoc = {
  name: string;
  title: string;
  category: Category;
  description: string;
  /** The first is the main preview; the rest are listed under Examples. */
  examples?: Example[];
  /** Until an entry moves to examples/: a preview without a Code tab. */
  example?: ReactNode;
  /** The smallest correct use, imports included. */
  usage?: string;
  props: Prop[];
  /** Subcomponents after the main one, each with its own props. */
  parts?: ApiPart[];
  accessibility?: Accessibility;
  security: string[];
};

const baseProps = (part: string): Prop[] => [
  { name: "...props", type: `${part} props`, description: "Every prop of the underlying Base UI part, including render for composition." },
];

const exampleNav = (
  <Sidebar
    className="w-60 rounded-xl"
    header={<span className="px-2 font-semibold">Acme Studio</span>}
    groups={[
      { label: "Areas", items: [
        { href: "#pipeline", label: "Sales pipeline" },
        { href: "#social", label: "Social media", disabled: true, disabledReason: "opens after hiring a social media agent" },
      ] },
      { label: "Work", items: [
        { href: "#home", label: "Home", active: true },
        { href: "#approvals", label: "Approvals", count: 3, countLabel: "3 waiting" },
        { href: "#hands", label: "Raised hands", count: 1, countLabel: "1 waiting" },
      ] },
    ]}
    footer={<span className="px-2">Jordan · CEO</span>}
  />
);

/** The written guides; they join the navigation and the search next to the components. */
export const guides: { href: string; title: string; description: string; category: Category }[] = [
  { href: "/docs", title: "Introduction", description: "What Aedis UI is and how to install it.", category: "Getting started" },
  { href: "/docs/theming", title: "Theming", description: "The color, type, depth, shape and motion tokens.", category: "Getting started" },
  { href: "/themes", title: "Themes", description: "Create your own theme, check its contrast and import it with the CLI.", category: "Getting started" },
  { href: "/docs/server-actions", title: "Server Actions", description: "Keep every Server Action safe with secureAction.", category: "Transport" },
  { href: "/docs/micro-frontends", title: "Micro-frontends", description: "Compose apps from isolated frames and elements.", category: "Micro-frontends" },
];

/** One entry per registry item. The docs page and the sidebar are generated from this list. */
export const components: ComponentDoc[] = [
  {
    name: "app-shell",
    title: "App Shell",
    category: "Navigation",
    description: "Sidebar and main region. Below md, the sidebar hides behind a menu toggle in a top bar.",
    example: (
      <div className="h-80 overflow-hidden rounded-xl border border-border">
        <AppShell className="min-h-0 h-full" title="Approvals" sidebar={exampleNav}>
          <p className="text-sm text-muted-foreground">Page content.</p>
        </AppShell>
      </div>
    ),
    props: [
      { name: "sidebar", type: "ReactNode", description: "The navigation, usually a Sidebar." },
      { name: "title", type: "ReactNode", description: "Shown in the top bar on small screens." },
      { name: "menuLabel", type: "string", description: "Accessible name of the menu toggle. Defaults to the Locale provider." },
    ],
    security: ["The toggle exposes aria-expanded and aria-controls; the sidebar stays a navigation landmark."],
  },
  {
    name: "approval-card",
    title: "Approval Card",
    category: "AI and agents",
    description: "A request from an agent that waits for a human before anything leaves the company.",
    example: <ApprovalCardExample />,
    props: [
      { name: "requester", type: "string", description: "Who asks, usually the agent's name." },
      { name: "content", type: "string", description: "What is being approved, as untrusted markdown." },
      { name: "requestedAt", type: "string", description: "Already formatted time." },
      { name: "onApprove", type: "() => Promise<string | null>", description: "Resolve with an error message to show it, or null." },
      { name: "onRequestChanges", type: "(reason) => Promise<string | null>", description: "Called with the required reason." },
      { name: "labels", type: "Partial<ApprovalCardLabels>", description: "Override single strings; the rest comes from the Locale provider (English by default)." },
    ],
    security: [
      "Approving always goes through an Alert Dialog that starts on Cancel; the app can relabel it, not skip it.",
      "Requesting changes requires a non-empty reason.",
      "Content renders through Markdown (no raw HTML, safe links).",
    ],
  },
  {
    name: "hand-raise",
    title: "Hand Raise",
    category: "AI and agents",
    description: "A question an agent could not resolve with the knowledge base or its colleagues.",
    example: <HandRaiseExample />,
    props: [
      { name: "agent", type: "string", description: "The agent asking." },
      { name: "question", type: "string", description: "Plain text." },
      { name: "tried", type: "string | null", description: "What the agent already tried." },
      { name: "onAnswer", type: '(answer, scope: "once" | "always") => Promise<string | null>', description: "Resolve with an error message, or null." },
      { name: "labels", type: "Partial<HandRaiseLabels>", description: "Override single strings; the rest comes from the Locale provider (English by default)." },
    ],
    security: [
      "Scope starts at \"Just this case\"; \"Always\" explains that the answer becomes a lasting rule.",
      "The question is rendered as plain text.",
    ],
  },
  {
    name: "chat",
    title: "Chat",
    category: "AI and agents",
    description: "Conversation with an agent. Agent messages render as safe markdown; people's messages as plain text.",
    example: <ChatExample />,
    props: [
      { name: "messages", type: "{ id; author; role: \"person\" | \"agent\" | \"system\"; content }[]", description: "The conversation. Content is untrusted." },
      { name: "onSend", type: "(text) => Promise<void>", description: "Send the text; throw to keep the draft and show the error." },
      { name: "working", type: "string", description: "Indicator while the agent works." },
      { name: "maxLength", type: "number", default: "8000", description: "Match your server limit." },
      { name: "labels", type: "Partial<ChatLabels>", description: "placeholder, send, message, log, sendError." },
    ],
    security: [
      "Agent output goes through Markdown: no raw HTML, only http, https and mailto links.",
      "The log region has aria-live, so new messages are announced.",
      "Enter sends and Shift+Enter adds a line; IME composition never sends.",
    ],
  },
  {
    name: "locale",
    title: "Locale",
    category: "Foundations",
    description: "Locale provider and dictionaries: every Aedis UI component reads its text from here, in English, Portuguese or Spanish.",
    example: <LocaleExample />,
    props: [
      { name: "locale", type: "string", description: 'BCP 47 tag the app already resolved, e.g. "pt-BR". Drives formatting too.' },
      { name: "messages", type: "Messages", default: "en", description: "Dictionary: en (built in), ptBR (locale-pt-br) or es (locale-es)." },
      { name: "useMessages(key, labels)", type: "hook", description: "For component authors: a component's strings with the labels prop overriding single entries." },
    ],
    security: [
      "Without a provider every component stays in English, so adding it never breaks a page.",
      "The labels prop still wins over the dictionary for a single string.",
      "App copy stays in the app (e.g. next-intl); pass its resolved locale here so there is one source of truth.",
      "Sidebar is a Server Component and does not read the provider: pass label={messages.sidebar.label}.",
    ],
  },
  {
    name: "locale-switcher",
    title: "Locale Switcher",
    category: "Foundations",
    description: "Language picker. The app stores the choice and re-renders the provider.",
    example: <LocaleExample />,
    props: [
      { name: "locales", type: "{ code; label }[]", description: "Options, each label in its own language." },
      { name: "value", type: "string", description: "Selected locale. Defaults to the provider locale." },
      { name: "onChange", type: "(code) => void", description: "Called with the chosen BCP 47 tag." },
      { name: "label", type: "string", description: "Accessible name. Defaults to the dictionary." },
    ],
    security: ["A native select: keyboard and screen readers work everywhere; each option carries its own lang."],
  },
  {
    name: "use-format",
    title: "useFormat",
    category: "Foundations",
    description: "Date, number, currency and relative time in the provider locale, on the platform Intl APIs.",
    example: (
      <pre className="overflow-x-auto text-sm">
        <code>{`const f = useFormat();
f.relative(message.createdAt); // "há 4 minutos"
f.currency(449, "BRL");        // "R$ 449,00"
f.date(invoice.dueAt);         // "18 de out. de 2026"`}</code>
      </pre>
    ),
    props: [
      { name: "date(value, options?)", type: "string", description: 'Intl.DateTimeFormat; default { dateStyle: "medium" }.' },
      { name: "dateTime(value)", type: "string", description: "Medium date and short time." },
      { name: "number(value, options?)", type: "string", description: "Intl.NumberFormat." },
      { name: "currency(value, code)", type: "string", description: "ISO 4217 code, e.g. BRL or USD." },
      { name: "relative(value, now?)", type: "string", description: '"2 minutes ago", "yesterday", "in 3 days".' },
    ],
    security: ["No dependency: uses the Intl APIs of the runtime.", "Pass the time zone in options when the server and the viewer differ."],
  },
  {
    name: "markdown",
    title: "Markdown",
    category: "Data display",
    description: "Renders untrusted markdown from agents or users.",
    example: (
      <Markdown className="text-sm">{"**Proposal** for *Acme*:\n\n- 4 days a month\n- [terms](https://example.com) · [bad](javascript:alert(1))\n\n<img src=x onerror=alert(1)> <b>raw html is dropped</b>"}</Markdown>
    ),
    props: [
      { name: "children", type: "string", description: "The markdown." },
      { name: "allowImages", type: "boolean", default: "false", description: "Render images. Off by default: image URLs leak the reader's IP and read receipts." },
    ],
    security: [
      "Raw HTML is never rendered (no rehype-raw).",
      "Only http, https, mailto and relative URLs survive; javascript:, data: and others become plain text.",
      "External links open in a new tab with rel=\"noopener noreferrer\".",
    ],
  },
  {
    name: "streaming-markdown",
    title: "Streaming Markdown",
    category: "AI and agents",
    description: "Markdown for an agent answer that arrives token by token.",
    example: <StreamingExample />,
    props: [
      { name: "children", type: "string", description: "The answer so far, as untrusted markdown." },
      { name: "streaming", type: "boolean", default: "false", description: "Tokens still arriving: caret on, incomplete links held back, aria-busy." },
      { name: "maxLength", type: "number", default: "100000", description: "Longer answers are cut." },
      { name: "allowImages", type: "boolean", default: "false", description: "As in Markdown." },
      { name: "settledMarkdown(text)", type: "string", description: "The text rendered while streaming, for custom renderers." },
    ],
    security: [
      "Same rules as Markdown: no raw HTML, safe link protocols, images off by default, hidden characters removed.",
      "A link becomes clickable only once it closes, and a bare URL only once it is followed by a space: a half-written URL is never clickable.",
      "Rendered at most once per animation frame, with a length cap, so a fast or runaway stream cannot freeze the page.",
    ],
  },
  {
    name: "prompt-input",
    title: "Prompt Input",
    category: "AI and agents",
    description: "The composer for an agent chat: bounded text, attachments, a model picker and a send button that turns into stop.",
    example: <PromptInputExample />,
    props: [
      { name: "onSend", type: "(message, { signal }) => Promise<void>", description: "Resolve when the answer is complete; Stop aborts signal. Throw to keep the draft." },
      { name: "maxLength", type: "number", default: "8000", description: "Match your server limit." },
      { name: "attachments", type: "{ accept; maxBytes; uploadPath; maxFiles? }", description: "Turns attachments on: MIME or extension allow-list, size limit, same-origin upload path (default 10 files)." },
      { name: "models / model / onModelChange", type: "{ value; label }[] / string / (value) => void", description: "Optional agent or model picker." },
      { name: "labels", type: "Partial<PromptInputLabels>", description: "Every string, in the dictionary." },
      { name: "checkAttachment / safeFileName / uploadAttachment", type: "lib", description: "The same rules for your own upload UI." },
    ],
    security: [
      "Text is bounded and has hidden characters removed before it is sent.",
      "Attachments: type allow-list (an image/* wildcard never admits SVG), size and count limits, uploaded same-origin with X-Requested-With, redirects refused.",
      "File names are shown without bidi controls or control characters (RLO spoofing, T1036.002); files are never previewed, so an SVG is never inlined.",
      "Stop aborts the request through AbortController; cancel the work on the server through that same signal.",
      "The browser guesses a file's type from its name: the server must check the content again.",
    ],
  },
  {
    name: "feedback",
    title: "Feedback",
    category: "AI and agents",
    description: "Thumbs up or down on an agent answer, with an optional comment, for evaluating agents.",
    example: <FeedbackExample />,
    props: [
      { name: "messageId", type: "string", description: "The answer being rated, from the app; never typed by the person." },
      { name: "endpoint", type: "string", description: "Same-origin path; receives { messageId, rating, comment? } through api()." },
      { name: "maxLength", type: "number", default: "1000", description: "Longest comment." },
      { name: "labels", type: "Partial<FeedbackLabels>", description: "Every string, in the dictionary." },
    ],
    security: [
      "Sent through api(): same-origin, X-Requested-With, redirects refused.",
      "The comment is bounded and has hidden characters removed.",
      "The message id comes from the app, so nobody can rate an answer they did not see by typing its id.",
    ],
  },
  {
    name: "sources",
    title: "Sources",
    category: "AI and agents",
    description: "Citations for answers grounded in documents: a numbered list and inline markers.",
    example: (
      <div className="space-y-3 text-callout">
        <p>
          Shoot days are billed monthly<Citation n={1} idPrefix="example-sources" title="Pricing policy 2026" /> and delivered in 48 hours
          <Citation n={2} idPrefix="example-sources" title="Service levels" />.
        </p>
        <Sources
          idPrefix="example-sources"
          sources={[
            { title: "Pricing policy 2026", url: "https://www.example.com/docs/pricing", snippet: "Shoot days are billed monthly, in advance." },
            { title: "Service levels", url: "/docs/approval-card" },
          ]}
        />
      </div>
    ),
    props: [
      { name: "Sources sources", type: "{ title; url; snippet? }[]", description: "Titles and snippets are text; URLs go through safeUrl." },
      { name: "Sources idPrefix", type: "string", description: "Anchor prefix shared with the inline Citation markers." },
      { name: "Citation n / idPrefix / title?", type: "number / string / string", description: "Inline marker linking to entry n, named \"Source n: title\"." },
      { name: "sourceDomain(url)", type: "string | null", description: "The host a person lands on, punycode for international names." },
      { name: "labels", type: "Partial<SourcesLabels>", description: "title, source." },
    ],
    security: [
      "Every link goes through safeUrl; external ones open with noopener noreferrer and are marked.",
      "The domain is shown next to the title, in punycode for international names, so a lookalike domain cannot pass for the real one.",
      "No favicon is fetched from third parties: nothing leaks who reads the answer, and img-src stays strict.",
      "Titles and snippets are text, hidden characters removed.",
    ],
  },
  {
    name: "tool-call",
    title: "Tool Call",
    category: "AI and agents",
    description: "Which tool an agent ran, with what and what came back; tools that act outside wait for approval.",
    example: (
      <div className="grid gap-3">
        <ToolCall name="crm.lookup" status="done" args={{ email: "ana@acme.com", apiKey: "sk_live_123" }} result={{ name: "Ana", plan: "Pro" }} />
        <ToolCall name="calendar.search" status="running" args={{ week: "2026-W43" }} />
        <Reasoning durationMs={3800}>{"The client asked for four days. Check the calendar first, then draft the proposal with token=abc123 redacted."}</Reasoning>
      </div>
    ),
    props: [
      { name: "name / status", type: 'string / "running" | "done" | "error" | "awaiting-approval"', description: "What ran and where it is." },
      { name: "args / result", type: "unknown", description: "Shown as JSON text after redaction." },
      { name: "external + approval", type: "boolean + { requester; onApprove; onRequestChanges }", description: "A tool that acts outside waits in an ApprovalCard while awaiting approval." },
      { name: "redactKeys", type: "string[]", description: "Replaces the default keys: password, secret, token, authorization, api key, cookie, session, credential…" },
      { name: "Reasoning", type: "component", description: "children (markdown), streaming, durationMs; starts collapsed, same redaction." },
      { name: "redact(value) / redactText(text)", type: "lib", description: "The same redaction for your own views and logs." },
    ],
    security: [
      "Arguments and results are rendered as data (escaped JSON in a code block), never as markup.",
      "Values under secret-looking keys, bearer tokens, JWTs and key=value secrets are redacted before anything is shown; long values, arrays and depth are bounded.",
      "An external tool waiting for approval goes through ApprovalCard, which confirms through an AlertDialog that starts on Cancel.",
      "Reasoning starts collapsed and uses the same redaction.",
    ],
  },
  {
    name: "code-block",
    title: "Code Block",
    category: "Data display",
    description: "Code with token highlighting, a copy button and an optional line-by-line reveal for quickstarts.",
    example: (
      <div className="space-y-4">
        <CodeBlock title="app/page.tsx" lang="tsx" code={'import { Button } from "@/components/ui/button";\n\nexport default function Page() {\n  return <Button>Approve</Button>;\n}'} />
        <CodeBlock animated lang="bash" code={"npx @aedis/cli@0.1.0 add approval-card\npnpm dev"} />
      </div>
    ),
    props: [
      { name: "code", type: "string", description: "The code, rendered as text. Copy copies exactly this." },
      { name: "lang", type: "string", default: '"text"', description: "Any language shiki bundles; unknown ones are plain text." },
      { name: "title", type: "string", description: "Shown above the code, e.g. a file name." },
      { name: "animated", type: "boolean", default: "false", description: "Reveal lines one by one when scrolled into view, once. Off under reduced motion." },
      { name: "lineDelay", type: "number", default: "120", description: "Milliseconds between lines when animated." },
      { name: "labels", type: "Partial<CodeBlockLabels>", description: "copy, copied, copyFailed, hidden." },
    ],
    security: [
      "Highlighting comes from shiki tokens rendered as React text, never codeToHtml; token colors are limited to the theme's --syntax-* variables.",
      "Bidi controls and zero-width characters are shown as visible U+XXXX markers instead of being removed (Trojan Source, CVE-2021-42574).",
      "Copy happens only on a click, as plain text, and copies the original code without the markers.",
      "Uses shiki's JavaScript regex engine: no WebAssembly, so a CSP without 'wasm-unsafe-eval' keeps working.",
    ],
  },
  {
    name: "navigation-menu",
    title: "Navigation Menu",
    category: "Navigation",
    description: "Top navigation for a public site, with panels of grouped links.",
    example: (
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Components</NavigationMenuTrigger>
            <NavigationMenuContent className="grid w-72 gap-1">
              <NavigationMenuLink href="/docs/approval-card">
                <span className="block font-medium">Approval Card</span>
                <span className="block text-footnote text-muted-foreground">Agent requests that wait for a person.</span>
              </NavigationMenuLink>
              <NavigationMenuLink href="/docs/chat">
                <span className="block font-medium">Chat</span>
                <span className="block text-footnote text-muted-foreground">Conversation with an agent, output as data.</span>
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem active>
            <NavigationMenuLink href="/docs/navigation-menu" active>Docs</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="https://github.com/aedis-build/aedis-ui">GitHub</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    ),
    props: [
      { name: "NavigationMenuLink href", type: "string", description: "Goes through safeUrl; a refused URL renders as text. External links get rel=\"noopener noreferrer\" and a marker." },
      { name: "NavigationMenuItem active", type: "boolean", description: "The current section; the indicator rests under it when no panel is open." },
      { name: "align", type: '"start" | "center" | "end"', default: '"start"', description: "Panel alignment under the trigger." },
      { name: "labels", type: "Partial<NavigationMenuLabels>", description: "label: accessible name of the landmark." },
      ...baseProps("@base-ui/react NavigationMenu"),
    ],
    security: [
      "Every href goes through safeUrl: javascript:, data: and vbscript: never become links.",
      "External links get rel=\"noopener noreferrer\" and a visible arrow with screen-reader text, so people know they leave the site.",
    ],
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
    security: [
      "Modal: focus is trapped while open and returns to the trigger on close; the page behind is inert; Escape closes.",
      "Title and description are wired to aria-labelledby and aria-describedby.",
    ],
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
      { name: "DropdownMenuLabel, Separator, Group, Shortcut", description: "Structure: a group heading, a hairline, a group and a key hint shown at the end of an item.", props: [] },
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
    security: [
      "A destructive item never runs on its own click: it asks through an AlertDialog whose focus starts on Cancel, the same rule as outbound agent actions.",
      "Link items go through safeUrl; external links never get window.opener and are marked.",
    ],
  },
  {
    name: "accordion",
    title: "Accordion",
    category: "Data display",
    description: "FAQ and docs sections that expand.",
    example: (
      <Accordion className="max-w-lg">
        <AccordionItem value="who">
          <AccordionTrigger>Who approves what the agent sends?</AccordionTrigger>
          <AccordionContent>A person on the team. Anything that leaves the company waits in an Approval Card.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="data">
          <AccordionTrigger>Can the agent read my passwords?</AccordionTrigger>
          <AccordionContent>No. The session lives in an HttpOnly cookie that no script can read.</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
    props: [
      { name: "multiple", type: "boolean", default: "false", description: "Allow several items open at once." },
      { name: "hiddenUntilFound", type: "boolean", default: "true", description: "Collapsed content stays in the DOM and opens when the browser's in-page search finds it." },
      ...baseProps("@base-ui/react Accordion"),
    ],
    security: ["Content is rendered as data; collapsed content stays in the DOM, so nothing is fetched or injected on open."],
  },
  {
    name: "collapsible",
    title: "Collapsible",
    category: "Data display",
    description: "Shows and hides one area.",
    example: (
      <Collapsible className="max-w-lg space-y-2">
        <CollapsibleTrigger render={<Button variant="outline" />}>Show the three steps</CollapsibleTrigger>
        <CollapsibleContent>
          <ol className="list-decimal space-y-1 pl-5 text-callout">
            <li>Add the registry.</li>
            <li>Import the theme.</li>
            <li>Add a component.</li>
          </ol>
        </CollapsibleContent>
      </Collapsible>
    ),
    props: [
      { name: "CollapsibleContent hiddenUntilFound", type: "boolean", default: "true", description: "Findable with in-page search while collapsed." },
      ...baseProps("@base-ui/react Collapsible"),
    ],
    security: ["Content is rendered as data."],
  },
  {
    name: "alert",
    title: "Alert",
    category: "Feedback",
    description: "A callout for status, success, warnings and errors.",
    example: (
      <div className="grid gap-3">
        <Alert>
          <AlertTitle>Approvals moved</AlertTitle>
          <AlertDescription>Pending approvals now live in the sidebar.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Could not send the proposal</AlertTitle>
          <AlertDescription>Nothing was sent. Try again in a minute.</AlertDescription>
        </Alert>
      </div>
    ),
    props: [
      { name: "variant", type: '"default" | "success" | "warning" | "destructive"', default: '"default"', description: "Only destructive uses role=\"alert\"; the rest are role=\"status\"." },
      { name: "role", type: "string", description: "Override when the default announcement is wrong for the context." },
    ],
    security: [
      "Text only: no prop takes markup.",
      "Write the message yourself; never show the server's error text as is (it can disclose internals).",
    ],
  },
  {
    name: "empty",
    title: "Empty",
    category: "Feedback",
    description: "The state of a page or list with nothing in it yet, and what to do next.",
    example: (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="6" r="2.5" /><path d="M3.5 13.5a4.5 4.5 0 0 1 9 0" /></svg>
          </EmptyMedia>
          <EmptyTitle>No agents yet</EmptyTitle>
          <EmptyDescription>Hire your first agent to start handing off work.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>Hire an agent</Button>
        </EmptyContent>
      </Empty>
    ),
    props: [{ name: "EmptyMedia variant", type: '"default" | "icon"', default: '"default"', description: "Decorative, hidden from assistive technology." }],
    security: ["Text only."],
  },
  {
    name: "spinner",
    title: "Spinner",
    category: "Feedback",
    description: "Loading indicator.",
    example: (
      <div className="flex items-center gap-6">
        <Spinner />
        <Button disabled>
          <Spinner className="text-current" labels={{ label: "Sending" }} />
        </Button>
      </div>
    ),
    props: [
      { name: "labels", type: "Partial<SpinnerLabels>", description: "label: what is loading, announced politely." },
      { name: "...props", type: "span props", description: "Every prop of the wrapping span (role=\"status\")." },
    ],
    security: ["With reduced motion it stops rotating and shows its label as text."],
  },
  {
    name: "kbd",
    title: "Kbd",
    category: "Data display",
    description: "A key or a key combination.",
    example: (
      <p className="text-callout">
        Search with{" "}
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </p>
    ),
    props: [{ name: "KbdGroup", type: "kbd", description: "A combination: nested kbd elements, as HTML specifies." }],
    security: ["Text only."],
  },
  {
    name: "site-header",
    title: "Site Header",
    category: "Navigation",
    description: "The sticky top bar of a site: brand, navigation and actions. Below md the items and actions move into a sheet.",
    example: (
      <SiteHeader
        className="static"
        brand="Aedis"
        items={[
          { label: "Docs", href: "/docs/site-header", active: true },
          { label: "Components", href: "/docs/button" },
        ]}
        actions={
          <Button size="sm" render={<a href="https://github.com/aedis-build/aedis-ui" rel="noopener noreferrer" />}>
            GitHub
          </Button>
        }
      />
    ),
    props: [
      { name: "brand", type: "ReactNode", description: "Logo or name, wrapped in a link to homeHref named by labels.home." },
      { name: "homeHref", type: "string", default: '"/"', description: "Where the brand links; goes through safeUrl." },
      { name: "items", type: "{ label: string; href: string; active?: boolean }[]", description: "The navigation. active marks the current section (indicator and aria-current)." },
      { name: "actions", type: "ReactNode", description: "Right side from md up (e.g. a GitHub link and a primary Button); inside the sheet below md." },
      { name: "labels", type: "Partial<SiteHeaderLabels>", description: "home: name of the brand link; menu: the menu button and sheet title." },
      { name: "className", type: "string", description: "Classes for the header element." },
    ],
    security: [
      "Every href goes through safeUrl: javascript:, data: and vbscript: never become links.",
      "External items get rel=\"noopener noreferrer\" and a visible marker.",
    ],
  },
  {
    name: "site-footer",
    title: "Site Footer",
    category: "Navigation",
    description: "The bottom of a site: links and notes such as the license.",
    example: (
      <SiteFooter
        links={[
          { label: "Docs", href: "/docs/site-footer" },
          { label: "GitHub", href: "https://github.com/aedis-build/aedis-ui" },
        ]}
      >
        MIT licensed.
      </SiteFooter>
    ),
    props: [
      { name: "links", type: "{ label: string; href: string }[]", description: "Rendered with Link: safe protocols only, external marker and noopener." },
      { name: "children", type: "ReactNode", description: "Notes, e.g. the license line." },
      { name: "labels", type: "Partial<SiteFooterLabels>", description: "label: accessible name of the footer navigation." },
      { name: "className", type: "string", description: "Classes for the footer element." },
    ],
    security: ["Refused URLs render their text without a link.", "External links never get window.opener or the Referer of this page."],
  },
  {
    name: "breadcrumb",
    title: "Breadcrumb",
    category: "Navigation",
    description: "Where a page sits in the site.",
    example: (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/docs/button">Components</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    ),
    props: [
      { name: "BreadcrumbLink href", type: "string", description: "Goes through safeUrl; pass render={<Link />} for a router link." },
      { name: "BreadcrumbPage", type: "span", description: "The current page, with aria-current=\"page\"." },
      { name: "labels", type: "Partial<BreadcrumbLabels>", description: "label (landmark), more (ellipsis)." },
    ],
    security: ["Every href goes through safeUrl; external links get noopener noreferrer and a marker."],
  },
  {
    name: "pagination",
    title: "Pagination",
    category: "Navigation",
    description: "Previous, next and page links for paginated lists.",
    example: (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="?page=4" />
          </PaginationItem>
          {paginationRange(5, 12).map((p, i) => (
            <PaginationItem key={i}>{p === "ellipsis" ? <PaginationEllipsis /> : <PaginationLink href={`?page=${p}`} isActive={p === 5}>{p}</PaginationLink>}</PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext href="?page=6" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    ),
    props: [
      { name: "parsePage(value, total)", type: "number", description: "A page from the URL or a form, as an integer from 1 to total; anything else becomes 1." },
      { name: "paginationRange(page, total, siblings?)", type: '(number | "ellipsis")[]', description: "Pages to render around the current one." },
      { name: "PaginationLink isActive", type: "boolean", description: "The current page (aria-current=\"page\")." },
      { name: "labels", type: "Partial<PaginationLabels>", description: "label, previous, next, goPrevious, goNext, more." },
    ],
    security: [
      "Page numbers from the URL are untrusted: parsePage keeps integers within bounds and caps the total.",
      "Every href goes through safeUrl; a refused one renders a disabled page.",
    ],
  },
  {
    name: "item",
    title: "Item",
    category: "Data display",
    description: "A row in a list: media, content and actions.",
    example: (
      <ItemGroup aria-label="Agents" className="max-w-md">
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Avalo</ItemTitle>
            <ItemDescription>Answers leads on WhatsApp.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="secondary">Pause</Button>
          </ItemActions>
        </Item>
        <Item variant="outline" href="/docs/approval-card">
          <ItemContent>
            <ItemTitle>Talbot</ItemTitle>
            <ItemDescription>3 approvals waiting.</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    ),
    props: [
      { name: "href", type: "string", description: "Makes the row a link, through safeUrl. Inside an ItemGroup it is wrapped in a listitem and keeps its link role." },
      { name: "variant", type: '"default" | "outline" | "muted"', default: '"default"', description: "Surface." },
      { name: "size", type: '"default" | "sm"', default: '"default"', description: "Padding." },
      { name: "render", type: "ReactElement", description: "Another element to render, e.g. a router link." },
    ],
    security: ["Links go through safeUrl; external ones get noopener noreferrer and a marker."],
  },
  {
    name: "scroll-area",
    title: "Scroll Area",
    category: "Data display",
    description: "A scrollable region with consistent scrollbars, for code, side panels and long lists.",
    example: (
      <ScrollArea aria-label="Release notes" className="h-40 w-full max-w-md rounded-md border border-hairline bg-surface">
        <ul className="space-y-2 p-4 text-callout">
          {Array.from({ length: 20 }, (_, i) => (
            <li key={i}>Release 0.{20 - i}: security fixes and new components.</li>
          ))}
        </ul>
      </ScrollArea>
    ),
    props: [
      { name: "aria-label", type: "string", description: "Names the region; the viewport is focusable when it overflows so the keyboard can scroll it." },
      ...baseProps("@base-ui/react ScrollArea"),
    ],
    security: ["Scrolling stays native: wheel, touch, keyboard and in-page search work as usual."],
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
    security: ["role=\"group\" with a name; each button keeps its own semantics and tab stop."],
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
    example: <ToastExample />,
    props: [
      { name: "<Toaster />", type: "component", description: "Once near the root; renders the stack in the bottom corner. labels: region, close, failed." },
      { name: "toast.show / success / info / warning / error(title, options?)", type: "string id", description: "Text only. Errors are announced urgently (role=\"alert\"); the rest politely." },
      { name: "useToast().failed(options?)", type: "string id", description: "The generic failure message in the reader's language, for catch blocks." },
      { name: "options", type: "{ description?; timeout?; action?: { label; onClick } }", description: "Timeout in ms (0 keeps it); paused while hovered or focused." },
      { name: "toast.dismiss(id)", type: "void", description: "Close one toast." },
    ],
    security: [
      "Text only: title and description are strings, hidden characters removed.",
      "Show a message you wrote or the generic one; never the server's error text.",
      "Timers pause while the stack is hovered or focused, so nobody has to race a message.",
    ],
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
    security: ["Refused URLs render their text without a link.", "External links never get window.opener or the Referer of this page."],
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
    example: <p className="text-callout text-muted-foreground">const reduced = useReducedMotion();</p>,
    props: [{ name: "returns", type: "boolean", description: "Follows prefers-reduced-motion live; false on the server." }],
    security: ["No side effects; reads a media query."],
  },
  {
    name: "use-event-stream",
    title: "useEventStream",
    category: "Transport",
    description: "Hook that subscribes to a Server-Sent Events endpoint of this origin, e.g. the messages of a conversation as an agent writes them.",
    example: (
      <CodeBlock
        lang="tsx"
        code={`const state = useEventStream<Message>("/api/conversations/42/events", {
  events: ["message", "done"],
  onEvent: (message, { type }) => setMessages((m) => [...m, message]),
});`}
      />
    ),
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
    security: [
      "fetch with a streamed body, not EventSource: same-origin path, cookies same-origin only, redirects refused, X-Requested-With, no-store.",
      "Never a token in the query string: such paths throw. The session cookie (or a BFF, see bff-stream) authenticates the stream.",
      "Parser with limits per event and per connection; event types from an allow-list; malformed JSON ignored.",
      "Text is decoded in stream mode and stripInvisible runs on each assembled event, so a chunk boundary inside a surrogate pair cannot smuggle Unicode tags.",
      "204 stops for good, other 4xx stop with an error state, 5xx and network errors retry with capped backoff; it aborts on unmount.",
    ],
  },
  {
    name: "event-stream",
    title: "event-stream",
    category: "Transport",
    description: "The library under useEventStream: an incremental SSE parser and a fetch-based connection with resume and backoff, for code outside React.",
    example: (
      <CodeBlock
        lang="ts"
        code={`const { close } = connectEventStream<Progress>("/api/tasks/7/events", {
  events: ["progress"],
  onEvent: (p) => render(p),
  onState: (s) => setStatus(s),
});`}
      />
    ),
    props: [
      { name: "connectEventStream(path, options)", type: "{ close }", description: "Same options as useEventStream plus signal and onState." },
      { name: "createSseParser({ onEvent, onRetry?, maxEventBytes? })", type: "{ push(text), end() }", description: "Feed decoded text; chunking never changes the events." },
      { name: "assertStreamPath(path)", type: "void", description: "Throws for another origin or a token in the query string." },
    ],
    security: ["Same rules as useEventStream."],
  },
  {
    name: "bff-stream",
    title: "bffStream",
    category: "Transport",
    description: "A Next.js route handler that relays the API's event stream with the session's bearer, so the token never reaches the browser.",
    example: (
      <CodeBlock
        lang="ts"
        title="app/api/conversations/[id]/events/route.ts"
        code={`import { bffStream } from "@/lib/bff-stream";

export const dynamic = "force-dynamic";

export const GET = bffStream({
  upstream: (req) => \`\${process.env.API_URL}/conversations/\${conversationId(req)}/events\`,
  getAccessToken: async () => (await auth())?.accessToken ?? null,
});`}
      />
    ),
    props: [
      { name: "upstream", type: "string | URL | (request) => string | URL", description: "The API stream, from configuration; http(s) only. Never read a URL from the request." },
      { name: "getAccessToken", type: "(request) => string | null", description: "The bearer of the server-side session; null answers 401 without calling the API." },
      { name: "headers", type: "Record<string, string>", description: "Extra headers for the API; credentials, cookies and hop-by-hop headers throw." },
      { name: "log", type: "(message, details) => void", default: "console.error", description: "Where failure details go." },
      { name: "connectTimeoutMs", type: "number", default: "15000", description: "Wait for the API to start the stream." },
    ],
    security: [
      "The bearer comes from the server session only; the browser never sees it.",
      "Nothing from the browser goes upstream except a Last-Event-ID of at most 256 printable characters: no cookies, no Authorization, no query.",
      "No-store, no-transform and X-Accel-Buffering: no; upstream headers (Set-Cookie, internal ones) are not copied.",
      "The API request is aborted when the browser disconnects, and after connectTimeoutMs without a response.",
      "The browser gets a bare status (401, 403, 204 or 502); details go to the server log. server-only keeps it out of client bundles.",
    ],
  },
  {
    name: "secure-action",
    title: "secureAction",
    category: "Transport",
    description: "A wrapper for Server Actions: required authorization, rate limit, size limit and schema inside the action, and a typed result without error messages.",
    example: (
      <CodeBlock
        lang="ts"
        code={`export const renameAgent = secureAction({
  authorize: currentUser,
  schema: z.object({ id: z.string().uuid(), name: z.string().max(80) }),
  handler: ({ id, name }, user) => db.agents.rename(user.tenantId, id, name),
});

const result = await renameAgent({ id, name }); // { ok: true, data } | { ok: false, code }`}
      />
    ),
    props: [
      { name: "authorize", type: "() => Ctx | null", description: "Required; runs on every call. null answers \"unauthorized\"; throw ActionError(\"forbidden\") for a caller without the right." },
      { name: "schema", type: "StandardSchemaV1", description: "Any Standard Schema validator; the handler only sees its output. Invalid input returns the failing field paths." },
      { name: "maxInputBytes", type: "number", default: "65536", description: "Serialized size limit, files included, checked before validation." },
      { name: "rateLimit", type: "(ctx) => boolean", description: "Return false to answer \"rate-limited\"." },
      { name: "handler", type: "(input, ctx) => T", description: "Throw ActionError(\"not-found\" | \"conflict\" | …) for an expected failure." },
      { name: "taintSecret(message, lifetime, value)", type: "boolean", description: "React taint for a token (needs experimental.taint); false when unavailable." },
    ],
    security: [
      "Every Server Action is a public POST endpoint: authorization is a required argument and runs inside the action.",
      "Order: authorize, rate limit, size limit, schema, handler. An anonymous call is never parsed.",
      "The client gets a code, never an error message; details go to the server log.",
      "server-only import; see the Server Actions guide for allowedOrigins, bodySizeLimit, the Origin check and secrets in closures.",
    ],
  },
  {
    name: "mf-bridge",
    title: "mf-bridge",
    category: "Micro-frontends",
    description: "A typed, origin-checked postMessage channel between a host page and an embedded app.",
    example: (
      <CodeBlock
        lang="ts"
        code={`// Both sides declare what they accept.
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
parent.send("resize", { height: document.body.scrollHeight });`}
      />
    ),
    props: [
      { name: "target", type: "Window | () => Window | null", description: "The other window: the iframe's contentWindow, or window.parent." },
      { name: "origins", type: "string[]", description: "Exact origins from configuration; malformed entries and wildcards are dropped." },
      { name: "messages", type: "Record<type, { validate; maxBytes?; allowSecrets? }>", description: "Allow-list of accepted types, each with its validator." },
      { name: "maxBytes / timeoutMs", type: "number", default: "65536 / 5000", description: "Size limit per message; timeout for requests." },
      { name: "returns", type: "{ ready; send; on; request; handle; peerOrigin; close }", description: "Handshake promise, events and request/response with correlation ids." },
    ],
    security: [
      "targetOrigin is always explicit: the peer's origin after the ready/ack handshake, each allowed origin before it. Never \"*\".",
      "Every message is checked for event.source (the target window) and event.origin (the allow-list); a peer cannot change origin after the handshake.",
      "Per type: allow-list, validator and size limit; unknown types and kinds are dropped without an answer.",
      "No tokens between windows: payloads with secret-looking keys are refused in both directions unless the type opts in with allowSecrets. Use a same-site cookie or a BFF instead.",
      "A failing handler answers with a bare error; its message never crosses to the other window.",
    ],
  },
  {
    name: "mf-frame",
    title: "mf-frame",
    category: "Micro-frontends",
    description: "The host side of an embed: a sandboxed iframe that the embedded app sizes over mf-bridge, and the headers for both apps.",
    example: (
      <CodeBlock
        lang="tsx"
        code={`// Host page
<MfFrame src="https://agent.example.com/panel" title="Agent panel" maxHeight={900} />

// Embedded app (any component that renders inside the frame)
useReportHeight(["https://backoffice.example.com"]);

// middleware.ts of each app
headers: hostAppHeaders({ nonce, frameOrigins: [process.env.AGENT_ORIGIN!] })          // host
headers: embeddedAppHeaders({ nonce, hostOrigins: [process.env.BACKOFFICE_ORIGIN!] })  // embedded app`}
      />
    ),
    props: [
      { name: "src / title", type: "string / string", description: "Absolute http(s) URL; title is required." },
      { name: "sandbox", type: "SandboxToken[]", default: '["allow-scripts", "allow-forms"]', description: "Known tokens only; allow-same-origin is refused when the frame has the host's origin." },
      { name: "allow / referrerPolicy", type: "string", default: '"" / "strict-origin-when-cross-origin"', description: "Permissions policy (empty: no camera, mic, geolocation…) and referrer." },
      { name: "minHeight / maxHeight", type: "number", default: "120 / 4000", description: "Bounds for the height the embedded app reports." },
      { name: "onBridge / messages", type: "(bridge) => void / specs", description: "The mf-bridge to the embedded app, for its own messages." },
      { name: "useReportHeight(hostOrigins)", type: "hook", description: "In the embedded app: reports the document height to the host." },
      { name: "embeddedAppHeaders / hostAppHeaders", type: "lib", description: "securityHeaders with frame-ancestors (embedded) or frame-src (host) from configuration." },
    ],
    security: [
      "Minimal sandbox; allow-same-origin is refused for a frame on the host's origin, because with allow-scripts it could remove its own sandbox.",
      "Empty permissions policy, a referrer policy and a required title by default.",
      "The height comes over mf-bridge from the frame's origin only, and is bounded.",
      "frame-ancestors on the embedded app and frame-src on the host come from configuration; wildcards and malformed entries are dropped, so neither can become '*'.",
    ],
  },
  {
    name: "mf-element",
    title: "mf-element",
    category: "Micro-frontends",
    description: "Turns a React component into a Web Component, for embeds that need tighter integration with the host page than an iframe gives.",
    example: (
      <CodeBlock
        lang="tsx"
        code={`defineMfElement<{ agentName?: string; config?: Config }>("agent-panel", AgentPanel, {
  attributes: { "agent-name": "string", config: "json" },
  events: ["approve"],
  css: builtTailwindCss,
});

// Host page
<agent-panel agent-name="Avalo"></agent-panel>
panel.addEventListener("approve", (e) => approve(e.detail));`}
      />
    ),
    props: [
      { name: "attributes", type: 'Record<name, "string" | "number" | "boolean" | "json">', description: "Typed attributes, mapped to camelCase props and properties; bad values become undefined." },
      { name: "events", type: "string[]", description: "Events the component may emit through emit(); composed, bubbling CustomEvents. Others throw." },
      { name: "css", type: "string", description: "Stylesheet for the shadow root." },
      { name: "maxJsonBytes", type: "number", default: "16384", description: "Largest JSON attribute accepted." },
      { name: "el.props = { … }", type: "property", description: "For values that are not attributes, like objects and callbacks." },
    ],
    security: [
      "Trade-off: the element's code runs in the host page's origin. Every script on that page can reach what it holds, so never hand it a token unless the host accepts that risk; prefer an iframe (mf-frame) when the two apps should not trust each other.",
      "The host's CSP must allow the element's origin in script-src (and connect-src for its API).",
      "Shadow DOM isolates CSS both ways; it is not a security boundary.",
      "Attributes are parsed by type with a size limit for JSON, and only declared events leave the element.",
    ],
  },
  {
    name: "mf-context",
    title: "mf-context",
    category: "Micro-frontends",
    description: "Keeps an embedded app in step with its host: theme, locale and session, over mf-bridge.",
    example: (
      <CodeBlock
        lang="tsx"
        code={`// Host
const [bridge, setBridge] = useState<Bridge<typeof hostMessages> | null>(null);
const endSession = useMfContextHost(bridge, { mode, theme, locale });
<MfFrame src={AGENT_URL} title="Agent panel" messages={hostMessages} onBridge={setBridge} />
// on logout: endSession(); then sign out

// Embedded app
const { locale } = useMfContext({ hostOrigins: [BACKOFFICE_ORIGIN], locales: ["en", "pt-BR", "es"], onSessionEnd: signOut });`}
      />
    ),
    props: [
      { name: "useMfContextHost(bridge, { mode, theme?, locale })", type: "() => void", description: "Sends theme and locale on change; returns endSession for logout; relays the child's activity to useIdleTimeout." },
      { name: "useMfContext({ hostOrigins, locales, onSessionEnd, activityEveryMs? })", type: "{ locale; mode }", description: "Applies the host's theme, follows its locale, ends the session with it and reports activity (every 30 s at most)." },
      { name: "hostMessages / childMessages(locales)", type: "message specs", description: "What each side accepts." },
      { name: "ACTIVITY_EVENT", type: "string", description: "Dispatch on window to make useIdleTimeout count activity it cannot see." },
    ],
    security: [
      "Logout in the host ends the embedded app's session (session:end), so a session never outlives the host's.",
      "Idle time is shared: activity in the embedded app keeps the host's useIdleTimeout alive, and the host's timeout ends both.",
      "Theme and locale travel as data: the theme passes validateTheme again and is applied through the CSSOM; unknown locales are ignored.",
      "Built on mf-bridge: exact origins, source checks and no tokens in messages.",
    ],
  },
  {
    name: "use-idle-timeout",
    title: "useIdleTimeout",
    category: "Security",
    description: "Hook that calls back after a period without pointer or keyboard activity, so the app ends the session.",
    example: (
      <pre className="overflow-x-auto text-sm">
        <code>{`useIdleTimeout(15 * 60_000, () => signOut("idle"));`}</code>
      </pre>
    ),
    props: [
      { name: "ms", type: "number", description: "Idle period in milliseconds." },
      { name: "onIdle", type: "() => void", description: "Called once per idle period; sign out and clear state here." },
      { name: "enabled", type: "boolean", default: "true", description: "Off while signed out." },
    ],
    security: [
      "A tab that comes back into view past the limit fires at once, so a laptop that slept does not keep a live session.",
      "Ending the session is the app's job: revoke it on the server, not only in the browser.",
    ],
  },
  {
    name: "api",
    title: "api",
    category: "Transport",
    description: "Same-origin JSON client for the app's own backend.",
    example: (
      <pre className="overflow-x-auto text-sm">
        <code>{`const approvals = await api<Approval[]>("/api/approvals");
await api("/api/approvals/42/approve", { body: {}, csrfCookie: "XSRF-TOKEN" });`}</code>
      </pre>
    ),
    props: [
      { name: "path", type: "string", description: "Relative path on this origin; absolute URLs are refused." },
      { name: "body", type: "unknown", description: "JSON body; defaults the method to POST." },
      { name: "timeoutMs", type: "number", default: "30000", description: "Abort after this long." },
      { name: "csrfCookie", type: "string", description: "Cookie whose value is echoed in X-CSRF-Token." },
    ],
    security: [
      "Only relative paths: the session cookie never travels to another host, and redirects are refused.",
      "Sends X-Requested-With, which a cross-site form cannot; require it on the server with SameSite cookies.",
      "Responses that are not application/json are refused; 401 and 403 surface as ApiError with the status.",
      "Keep the session in an HttpOnly cookie. Never store a token in localStorage or sessionStorage.",
    ],
  },
  {
    name: "security-headers",
    title: "securityHeaders",
    category: "Security",
    description: "Response headers for an app built with these components: strict CSP, HSTS, no framing, no sniffing.",
    example: (
      <pre className="overflow-x-auto text-sm">
        <code>{`// proxy.ts (Next.js) or any edge/middleware
const nonce = crypto.randomUUID();
for (const [name, value] of Object.entries(securityHeaders({ nonce }))) response.headers.set(name, value);`}</code>
      </pre>
    ),
    props: [
      { name: "nonce", type: "string", description: "Per-request nonce; the framework must put it on its scripts." },
      { name: "hashes", type: "string[]", description: "Static sites: sha256-/sha384-/sha512- hashes of the inline scripts, computed at build time. Use instead of nonce; the policy is then 'self' plus the hashes." },
      { name: "connectSrc", type: "string[]", default: "[]", description: "Extra origins for fetch and SSE." },
      { name: "imgSrc", type: "string[]", default: "[]", description: "Extra origins for images." },
      { name: "frameAncestors", type: "string[]", default: "[]", description: "Who may frame the page; nobody by default." },
    ],
    security: [
      "script-src is nonce + strict-dynamic, or 'self' + build-time hashes on a static site: no inline script, no eval, no script from a CDN.",
      "A missing, doubled or malformed nonce or hash throws instead of producing a weaker policy.",
      "frame-ancestors 'none' and X-Frame-Options DENY stop clickjacking; form-action 'self' stops form hijacking.",
      "Cache-Control: no-store keeps pages with personal data out of shared caches.",
    ],
  },
  {
    name: "untrusted",
    title: "untrusted",
    category: "Security",
    description: "Helpers for text written by agents or people: removes code points that hide text from the reader.",
    example: (
      <pre className="overflow-x-auto text-sm">
        <code>{`stripInvisible("Pay\\u{E0049}\\u{E0047}\\u{E004E}\\u{E004F}\\u{E0052}\\u{E0045} the invoice") // "Pay the invoice"`}</code>
      </pre>
    ),
    props: [
      { name: "stripInvisible", type: "(text: string) => string", description: "Removes zero-width, bidi-override and Unicode-tag code points." },
      { name: "hasInvisible", type: "(text: string) => boolean", description: "Whether the text carries any of them." },
    ],
    security: [
      "Markdown, Chat, Approval Card and Hand Raise already apply it to what they show and send.",
      "Zero-width joiner/non-joiner and LRM/RLM are kept: emoji and right-to-left scripts need them.",
    ],
  },
  {
    name: "sidebar",
    title: "Sidebar",
    category: "Navigation",
    description: "Grouped navigation with counters for items waiting on a person, and areas that open later.",
    example: exampleNav,
    props: [
      { name: "groups", type: "{ label; items: SidebarItem[] }[]", description: "Groups of items: href, label, count, countLabel, active, icon, disabled, disabledReason." },
      { name: "header / footer", type: "ReactNode", description: "Organization switcher at the top, signed-in user at the bottom." },
      { name: "linkComponent", type: "ComponentType", default: "<a>", description: "Your router link, e.g. Next.js Link." },
      { name: "label", type: "string", default: '"Main navigation"', description: "Accessible name of the nav landmark." },
    ],
    security: [
      "Disabled items stay visible with their reason instead of disappearing, so people know an area exists.",
      "Counters have accessible text (countLabel), not just a number.",
    ],
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
    ],
    usage: `import { Button } from "@/components/ui/button";

<Button onClick={save}>Save</Button>
<Button type="submit">Send</Button>`,
    props: [
      { name: "variant", type: '"default" | "secondary" | "outline" | "ghost" | "destructive" | "link"', default: '"default"', description: "Visual style." },
      { name: "size", type: '"default" | "sm" | "lg" | "icon"', default: '"default"', description: "Height and padding." },
      { name: "render", type: "ReactElement | (props, state) => ReactElement", description: "Render another element (e.g. a link) with the button styles. It keeps its own role, so a link stays a link." },
    ],
    security: ["Defaults to type=\"button\": submitting a form must be explicit (type=\"submit\")."],
    accessibility: {
      keyboard: [["Enter / Space", "Activates the button."]],
      notes: ["An icon-only button needs an aria-label.", "Disabled buttons use the native disabled attribute, so they leave the tab order."],
      motion: "Presses sink on pointer-down and spring back on release. With reduced motion there is no scale.",
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
    security: [
      "Focus starts on Cancel, so pressing Enter right after opening never confirms.",
      "Escape and clicking outside do not confirm; only the action button does.",
    ],
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
    example: (
      <Avatar>
        <AvatarFallback>RA</AvatarFallback>
      </Avatar>
    ),
    props: baseProps("@base-ui/react Avatar"),
    security: ["Load avatar images from origins your CSP allows; the fallback renders when the image fails."],
  },
  {
    name: "badge",
    title: "Badge",
    category: "Data display",
    description: "Small status label: level, channel, state.",
    example: (
      <div className="flex gap-2">
        <Badge>Junior</Badge>
        <Badge variant="secondary">24/7</Badge>
        <Badge variant="accent">Hand raised</Badge>
        <Badge variant="outline">Slack</Badge>
      </div>
    ),
    props: [{ name: "variant", type: '"default" | "secondary" | "accent" | "outline" | "destructive"', default: '"default"', description: "Visual style." }],
    security: ["Text only; pass labels as children."],
  },
  {
    name: "card",
    title: "Card",
    category: "Data display",
    description: "Container with header, content and footer.",
    example: (
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Account Executive</CardTitle>
          <CardDescription>Turns opportunities into signed projects.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">Junior · business hours · 3 channels</CardContent>
        <CardFooter>
          <Button size="sm">Interview</Button>
        </CardFooter>
      </Card>
    ),
    props: [{ name: "...props", type: "div props", description: "Each part forwards the props of its element." }],
    security: ["No behavior; render agent text inside with the Chat or markdown components, never as raw HTML."],
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
    security: ["Consent checkboxes must start unchecked; do not pass defaultChecked for consent."],
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
    security: ["Focus is trapped while open and returns to the trigger on close."],
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
    security: [
      "Item labels, descriptions and groups render as text; the query never reaches the DOM as markup.",
      "The search field is bounded to 256 characters, like every Aedis Input.",
      "Focus stays in the field; the active option is announced with aria-activedescendant.",
    ],
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
    security: [
      "Text, search, email, url, tel and password inputs are limited to 256 characters unless maxLength says otherwise.",
      "Validate on the server too; client-side constraints are only a convenience.",
    ],
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
    security: ["Every control needs a label or an aria-label; tests check this with axe."],
    accessibility: {
      notes: ["A native label: clicking it focuses or toggles its control, and its text is the control's accessible name.", "Placed after a disabled peer control, it dims with it."],
    },
  },
  {
    name: "progress",
    title: "Progress",
    category: "Feedback",
    description: "Progress bar; the base of the usage meter.",
    example: <Progress value={62} aria-label="Ceiling used" className="max-w-sm" />,
    props: [{ name: "value", type: "number", description: "0 to 100; values outside are clamped." }, ...baseProps("@base-ui/react Progress")],
    security: ["Give it an aria-label; the value is announced to assistive technology."],
  },
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
    security: ["Arrow keys move between options; the group needs an accessible name."],
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
    example: (
      <div className="max-w-sm space-y-2 text-sm">
        <p>Plan</p>
        <Separator />
        <p>This week</p>
      </div>
    ),
    props: baseProps("@base-ui/react Separator"),
    security: ["Decorative by default (hidden from assistive technology)."],
  },
  {
    name: "skeleton",
    title: "Skeleton",
    category: "Feedback",
    description: "Loading placeholder.",
    example: (
      <div role="status" className="max-w-sm space-y-2" aria-busy="true" aria-label="Loading team">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ),
    props: [{ name: "...props", type: "div props", description: "Size it with classes." }],
    security: ["Hidden from assistive technology; give the loading region role=\"status\", aria-busy and a label."],
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
    security: ["Use disabled (not hidden) for settings that cannot be turned off, so the reason stays visible."],
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
    example: (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Ceiling used</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Rafael</TableCell>
            <TableCell>Account Executive</TableCell>
            <TableCell className="text-right">12%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
    props: [{ name: "...props", type: "table element props", description: "Each part forwards the props of its element." }],
    security: ["Render cell values as text."],
  },
  {
    name: "tabs",
    title: "Tabs",
    category: "Navigation",
    description: "Tabbed sections.",
    example: (
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="agents">Created by agents</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="text-sm">Every automation.</TabsContent>
        <TabsContent value="agents" className="text-sm">Automations agents proposed.</TabsContent>
      </Tabs>
    ),
    props: baseProps("@base-ui/react Tabs"),
    security: ["Arrow keys move between tabs."],
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
    security: ["Limited to 4000 characters by default; set maxLength to the server's limit so people see it before submitting."],
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
    security: ["Never put essential information only in a tooltip; it is not available on touch devices."],
    accessibility: {
      keyboard: [["Tab", "Focusing the trigger shows the tooltip."], ["Esc", "Hides it."]],
      notes: ["The tooltip describes its trigger; it is not shown on touch, so never put the only copy of information in it."],
      motion: "It materializes after a 300 ms delay and fades out in 200 ms. With reduced motion it only fades.",
    },
  },
];
