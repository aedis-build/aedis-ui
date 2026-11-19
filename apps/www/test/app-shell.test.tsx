import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { violations } from "./a11y";

import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { AppShell, AppShellAccountSwitcher } from "@/registry/aedis/ui/app-shell";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/registry/aedis/ui/breadcrumb";
import { DropdownMenuItem } from "@/registry/aedis/ui/dropdown-menu";
import { Sidebar } from "@/registry/aedis/ui/sidebar";

const nav = (
  <Sidebar
    groups={[
      { label: "Work", items: [
        { href: "/approvals", label: "Approvals", count: 2, countLabel: "2 waiting", active: true },
        { href: "/social", label: "Social media", disabled: true, disabledReason: "opens after the first hire" },
      ] },
    ]}
  />
);

describe("Sidebar", () => {
  it("marks the active item and announces counters", () => {
    render(nav);
    const link = screen.getByRole("link", { name: /Approvals/ });
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link).toHaveTextContent("2 waiting");
  });

  it("keeps disabled areas visible but not navigable, with the reason", () => {
    render(nav);
    expect(screen.queryByRole("link", { name: /Social media/ })).toBeNull();
    expect(screen.getByText("Social media").closest("[aria-disabled]")).toHaveAttribute("aria-disabled", "true");
    // Written out, not only in a title: touch screens never show a title (#160).
    expect(screen.getByText("opens after the first hire")).toBeVisible();
  });

  it("uses the router link component when given", () => {
    const Link = ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
      <a href={href} data-router="yes" {...rest}>{children}</a>
    );
    render(<Sidebar linkComponent={Link} groups={[{ label: "Work", items: [{ href: "/home", label: "Home" }] }]} />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("data-router", "yes");
  });
});

const nested = (
  <Sidebar
    groups={[
      { label: "Workspace", items: [{ href: "/overview", label: "Overview" }] },
      { label: "Products", items: [
        { label: "Identity", count: 4, countLabel: "4 waiting", items: [
          { label: "Access", items: [{ href: "/approvals", label: "Approvals", count: 3, countLabel: "3 waiting", active: true }] },
          { label: "Users", items: [{ href: "/people", label: "People" }] },
        ] },
        { label: "Compliance", items: [{ href: "/controls", label: "Controls" }] },
      ] },
    ]}
  />
);

const section = (name: string) => screen.getByText(name, { selector: "summary span" }).closest("details")!;

describe("Sidebar sections", () => {
  it("opens only the sections that hold the active page", () => {
    render(nested);
    expect(section("Identity")).toHaveAttribute("open");
    expect(section("Access")).toHaveAttribute("open");
    expect(section("Users")).not.toHaveAttribute("open");
    expect(section("Compliance")).not.toHaveAttribute("open");
    expect(screen.getByRole("link", { name: /Approvals/ })).toHaveAttribute("aria-current", "page");
  });

  it("keeps counters at every level", () => {
    render(nested);
    expect(section("Identity").querySelector("summary")).toHaveTextContent("4 waiting");
    expect(screen.getByRole("link", { name: /Approvals/ })).toHaveTextContent("3 waiting");
  });

  // jsdom has no keyboard activation for summary; Enter and Space are covered in navigation.behaviour.spec.ts.
  it("is reached by Tab, toggles on activation and reports it", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Sidebar onOpenChange={onOpenChange} groups={[{ label: "Products", items: [{ label: "Compliance", items: [{ href: "/controls", label: "Controls" }] }] }]} />);
    const details = section("Compliance");
    await user.tab();
    expect(details.querySelector("summary")).toHaveFocus();
    await user.click(details.querySelector("summary")!);
    expect(details).toHaveAttribute("open");
    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(expect.objectContaining({ label: "Compliance" }), true));
  });

  it("reports only a person's change, not the open state React renders on mount or from a new controlled value", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const groups = (open: boolean) => [{ label: "Products", items: [{ label: "Identity", open, items: [{ href: "/a", label: "A", active: true }] }, { label: "Users", items: [{ href: "/b", label: "B", active: true }] }] }];
    const { rerender } = render(<Sidebar onOpenChange={onOpenChange} groups={groups(true)} />);
    rerender(<Sidebar onOpenChange={onOpenChange} groups={groups(false)} />);
    await new Promise((r) => setTimeout(r, 20));
    expect(section("Users")).toHaveAttribute("open");
    expect(onOpenChange).not.toHaveBeenCalled();
    // Uncontrolled: closing and reopening the section that started open are both reported.
    await user.click(section("Users").querySelector("summary")!);
    await vi.waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(expect.objectContaining({ label: "Users" }), false));
    await user.click(section("Users").querySelector("summary")!);
    await vi.waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(expect.objectContaining({ label: "Users" }), true));
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("turns a chevron only for its own open section, not for an open ancestor", () => {
    render(nested);
    const chevron = (name: string) => section(name).querySelector(":scope > summary > svg")!;
    for (const name of ["Identity", "Access", "Users", "Compliance"]) expect(chevron(name).getAttribute("class")).toContain("[details[open]>summary>&]:rotate-90");
    // The rule the class compiles to: details[open] > summary > svg.
    expect(chevron("Identity").matches("details[open] > summary > svg")).toBe(true);
    expect(chevron("Access").matches("details[open] > summary > svg")).toBe(true);
    expect(chevron("Users").matches("details[open] > summary > svg")).toBe(false);
    expect(chevron("Users").closest("details[open]")).toBe(section("Identity"));
    expect(chevron("Users").getAttribute("class")).not.toContain("group-open");
  });

  it("follows a controlled open state", () => {
    render(<Sidebar groups={[{ label: "Products", items: [{ label: "Identity", open: false, items: [{ href: "/a", label: "A", active: true }] }] }]} />);
    expect(section("Identity")).not.toHaveAttribute("open");
  });

  it("hides the chevron from assistive technology and has no accessibility violations", async () => {
    const { container } = render(nested);
    expect(container.querySelector("summary svg")).toHaveAttribute("aria-hidden", "true");
    expect(await violations(container)).toEqual([]);
  });
});

describe("AppShell", () => {
  it("toggles the sidebar with an accessible button", async () => {
    const user = userEvent.setup();
    render(<AppShell sidebar={nav} menuLabel="Menu">content</AppShell>);
    const toggle = screen.getByRole("button", { name: "Menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)).toContainElement(screen.getByRole("navigation"));
  });
});

describe("AppShell without a sidebar (#275)", () => {
  const account = (props: { current?: string } = {}) => (
    <AppShell
      start={
        <AppShellAccountSwitcher current={props.current ?? "RLFN Tech"}>
          <DropdownMenuItem>Acme Studio</DropdownMenuItem>
        </AppShellAccountSwitcher>
      }
      end={<a href="/docs">Documentation</a>}
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/account">RLFN Tech</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Plan and billing</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <section className="md:col-span-8">content</section>
    </AppShell>
  );

  it("is a header with a breadcrumb nav over the main landmark, with no menu toggle, and passes axe", async () => {
    const { container } = render(account());
    const header = screen.getByRole("banner");
    expect(header).toContainElement(screen.getByRole("navigation", { name: "Breadcrumb" }));
    expect(screen.getByText("Plan and billing")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("main")).toHaveTextContent("content");
    expect(screen.queryByRole("button", { name: "Menu" })).toBeNull();
    expect(await violations(container)).toEqual([]);
  });

  it("names the account switcher with the current account, which is also its visible text", async () => {
    const user = userEvent.setup();
    render(account({ current: "RLFN\u200b Tech" }));
    const switcher = screen.getByRole("button", { name: "Switch account, current: RLFN Tech" });
    expect(switcher).toHaveTextContent("RLFN Tech");
    await user.click(switcher);
    expect(await screen.findByRole("menuitem", { name: "Acme Studio" })).toBeInTheDocument();
  });

  it("puts the account name in the switcher label as it is, even with replacement patterns like $&", () => {
    render(account({ current: "R$& D$1 Co" }));
    expect(screen.getByRole("button", { name: "Switch account, current: R$& D$1 Co" })).toBeInTheDocument();
  });

  it("keeps the sidebar layout when the sidebar slot is null; only leaving it out gives the account layout", () => {
    render(<AppShell sidebar={null} title="Approvals">x</AppShell>);
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
    expect(document.querySelector("[data-slot=app-shell]")).not.toHaveAttribute("data-layout");
  });

  it("reads the switcher name from the dictionary", () => {
    render(<LocaleProvider locale="pt-BR" messages={ptBR}>{account()}</LocaleProvider>);
    expect(screen.getByRole("button", { name: "Trocar de conta, atual: RLFN Tech" })).toBeInTheDocument();
  });

  it("keeps the content on one left-aligned grid that a narrower page spans in part", () => {
    render(account());
    const main = screen.getByRole("main");
    expect(main).toHaveClass("grid", "grid-cols-12", "max-w-280");
    expect(main).not.toHaveClass("mx-auto");
    expect(main.firstElementChild).toHaveClass("md:col-span-8");
  });
});
