import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/aedis/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/registry/aedis/ui/avatar";
import { Badge } from "@/registry/aedis/ui/badge";
import { Button } from "@/registry/aedis/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/registry/aedis/ui/card";
import { Checkbox } from "@/registry/aedis/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/registry/aedis/ui/dialog";
import { Input } from "@/registry/aedis/ui/input";
import { Label } from "@/registry/aedis/ui/label";
import { Progress } from "@/registry/aedis/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/registry/aedis/ui/radio-group";
import { AppShell } from "@/registry/aedis/ui/app-shell";
import { Separator } from "@/registry/aedis/ui/separator";
import { Sidebar } from "@/registry/aedis/ui/sidebar";
import { Skeleton } from "@/registry/aedis/ui/skeleton";
import { Switch } from "@/registry/aedis/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/aedis/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";
import { Textarea } from "@/registry/aedis/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/aedis/ui/tooltip";

export type Prop = { name: string; type: string; default?: string; description: string };

export type ComponentDoc = {
  name: string;
  title: string;
  description: string;
  example: ReactNode;
  props: Prop[];
  security: string[];
};

const radixProps = (primitive: string): Prop[] => [
  { name: "...props", type: `${primitive} props`, description: "Every prop of the underlying Radix primitive." },
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

/** One entry per registry item. The docs page and the sidebar are generated from this list. */
export const components: ComponentDoc[] = [
  {
    name: "app-shell",
    title: "App Shell",
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
      { name: "menuLabel", type: "string", default: '"Menu"', description: "Accessible name of the menu toggle." },
    ],
    security: ["The toggle exposes aria-expanded and aria-controls; the sidebar stays a navigation landmark."],
  },
  {
    name: "sidebar",
    title: "Sidebar",
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
    description: "The base action. Defaults to type=\"button\", so it never submits a form by accident.",
    example: (
      <div className="flex flex-wrap gap-3">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
    ),
    props: [
      { name: "variant", type: '"default" | "secondary" | "outline" | "ghost" | "destructive" | "link"', default: '"default"', description: "Visual style." },
      { name: "size", type: '"default" | "sm" | "lg" | "icon"', default: '"default"', description: "Height and padding." },
      { name: "asChild", type: "boolean", default: "false", description: "Render the child element with the button styles." },
    ],
    security: ["Defaults to type=\"button\": submitting a form must be explicit (type=\"submit\")."],
  },
  {
    name: "alert-dialog",
    title: "Alert Dialog",
    description: "Confirmation for actions that cannot be undone or that leave the company: send, approve, delete.",
    example: (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>Approve and send</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this proposal to the client?</AlertDialogTitle>
            <AlertDialogDescription>The agent will send it on the conversation channel right away.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Approve and send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    props: radixProps("@radix-ui/react-alert-dialog"),
    security: [
      "Focus starts on Cancel, so pressing Enter right after opening never confirms.",
      "Escape and clicking outside do not confirm; only the action button does.",
    ],
  },
  {
    name: "avatar",
    title: "Avatar",
    description: "Image with fallback initials, used for people and agents.",
    example: (
      <Avatar>
        <AvatarFallback>RA</AvatarFallback>
      </Avatar>
    ),
    props: radixProps("@radix-ui/react-avatar"),
    security: ["Load avatar images from origins your CSP allows; the fallback renders when the image fails."],
  },
  {
    name: "badge",
    title: "Badge",
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
    description: "Checkbox for consent and settings.",
    example: (
      <div className="flex items-center gap-2">
        <Checkbox id="can-approve" />
        <Label htmlFor="can-approve">Can approve what their team sends out</Label>
      </div>
    ),
    props: radixProps("@radix-ui/react-checkbox"),
    security: ["Consent checkboxes must start unchecked; do not pass defaultChecked for consent."],
  },
  {
    name: "dialog",
    title: "Dialog",
    description: "Modal dialog for forms and details. Use Alert Dialog for confirmations.",
    example: (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Invite a person</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a person</DialogTitle>
            <DialogDescription>They join after accepting the invitation.</DialogDescription>
          </DialogHeader>
          <Input aria-label="Email" placeholder="name@company.com" />
        </DialogContent>
      </Dialog>
    ),
    props: radixProps("@radix-ui/react-dialog"),
    security: ["Focus is trapped while open and returns to the trigger on close."],
  },
  {
    name: "input",
    title: "Input",
    description: "Text input.",
    example: (
      <div className="grid max-w-sm gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="name@company.com" />
      </div>
    ),
    props: [{ name: "...props", type: "input props", description: "Every prop of <input>. Set aria-invalid to show the error state." }],
    security: ["Validate on the server too; client-side constraints are only a convenience."],
  },
  {
    name: "label",
    title: "Label",
    description: "Accessible label for form controls.",
    example: <Label>Daily ceiling</Label>,
    props: radixProps("@radix-ui/react-label"),
    security: ["Every control needs a label or an aria-label; tests check this with axe."],
  },
  {
    name: "progress",
    title: "Progress",
    description: "Progress bar; the base of the usage meter.",
    example: <Progress value={62} aria-label="Ceiling used" className="max-w-sm" />,
    props: [{ name: "value", type: "number", description: "0 to 100; values outside are clamped." }, ...radixProps("@radix-ui/react-progress")],
    security: ["Give it an aria-label; the value is announced to assistive technology."],
  },
  {
    name: "radio-group",
    title: "Radio Group",
    description: "Single choice among options.",
    example: (
      <RadioGroup defaultValue="case" aria-label="Scope">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="case" id="case" />
          <Label htmlFor="case">Just this case</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="always" id="always" />
          <Label htmlFor="always">Always</Label>
        </div>
      </RadioGroup>
    ),
    props: radixProps("@radix-ui/react-radio-group"),
    security: ["Arrow keys move between options; the group needs an accessible name."],
  },
  {
    name: "separator",
    title: "Separator",
    description: "Visual or semantic divider.",
    example: (
      <div className="max-w-sm space-y-2 text-sm">
        <p>Plan</p>
        <Separator />
        <p>This week</p>
      </div>
    ),
    props: radixProps("@radix-ui/react-separator"),
    security: ["Decorative by default (hidden from assistive technology)."],
  },
  {
    name: "skeleton",
    title: "Skeleton",
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
    description: "On/off toggle, e.g. the channels an agent answers on.",
    example: (
      <div className="flex items-center gap-2">
        <Switch id="whatsapp" defaultChecked />
        <Label htmlFor="whatsapp">WhatsApp</Label>
      </div>
    ),
    props: radixProps("@radix-ui/react-switch"),
    security: ["Use disabled (not hidden) for settings that cannot be turned off, so the reason stays visible."],
  },
  {
    name: "table",
    title: "Table",
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
    props: radixProps("@radix-ui/react-tabs"),
    security: ["Arrow keys move between tabs."],
  },
  {
    name: "textarea",
    title: "Textarea",
    description: "Multi-line text input.",
    example: <Textarea aria-label="Your answer" placeholder="Your answer" className="max-w-sm" />,
    props: [{ name: "...props", type: "textarea props", description: "Every prop of <textarea>. Set maxLength to match the server limit." }],
    security: ["Set maxLength to the server's limit so users see it before submitting."],
  },
  {
    name: "tooltip",
    title: "Tooltip",
    description: "Short hint on hover or focus.",
    example: (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Ceiling</Button>
        </TooltipTrigger>
        <TooltipContent>The most this agent can cost per day.</TooltipContent>
      </Tooltip>
    ),
    props: radixProps("@radix-ui/react-tooltip"),
    security: ["Never put essential information only in a tooltip; it is not available on touch devices."],
  },
];
