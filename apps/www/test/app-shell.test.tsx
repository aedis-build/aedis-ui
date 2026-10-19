import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
    expect(screen.getByText("Social media").parentElement).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("(opens after the first hire)")).toBeInTheDocument();
  });

  it("uses the router link component when given", () => {
    const Link = ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
      <a href={href} data-router="yes" {...rest}>{children}</a>
    );
    render(<Sidebar linkComponent={Link} groups={[{ label: "Work", items: [{ href: "/home", label: "Home" }] }]} />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("data-router", "yes");
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
