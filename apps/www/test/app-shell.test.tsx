import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { violations } from "./a11y";

import { AppShell } from "@/registry/aedis/ui/app-shell";
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
