import { render, screen } from "@testing-library/react";

import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { Stat, StatGroup } from "@/registry/aedis/ui/stat";
import { violations } from "./a11y";

describe("stat (#280)", () => {
  it("reads label, value, delta in order, as a description list, and passes axe", async () => {
    const { container } = render(
      <StatGroup aria-label="Identity">
        <Stat label="People active this month" value={12480} delta="+4% from last month" />
        <Stat label="Agents" value={18} />
      </StatGroup>,
    );
    const stat = container.querySelector("[data-slot=stat]")!;
    expect([...stat.children].map((c) => [c.tagName, c.textContent])).toEqual([
      ["DT", "People active this month"],
      ["DD", "12,480"],
      ["DD", "+4% from last month"],
    ]);
    expect(stat.parentElement).toHaveAttribute("aria-label", "Identity");
    expect(await violations(container)).toEqual([]);
  });

  it("formats numbers and the total in the provider locale, and hides the duplicate bar", async () => {
    const { container } = render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <StatGroup stack>
          <Stat label="Uso do plano" value={13041} total={50000} />
        </StatGroup>
      </LocaleProvider>,
    );
    expect(container.querySelector("dd")).toHaveTextContent("13.041 de 50.000");
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(container.querySelector("[data-slot=progress]")!.closest("dd")).toHaveAttribute("aria-hidden", "true");
    expect(await violations(container)).toEqual([]);
  });

  it("shows a string value as given, takes labels, and draws no bar for a total of zero", () => {
    const { container } = render(
      <StatGroup>
        <Stat label="Uptime" value="—" total={0} labels={{ of: "out of {total}" }} />
      </StatGroup>,
    );
    expect(container.querySelector("dd")).toHaveTextContent("— out of 0");
    expect(container.querySelector("[data-slot=progress]")).toBeNull();
  });

  it("keeps a total that contains $& literal", () => {
    const { container } = render(
      <StatGroup>
        <Stat label="Spend" value={1} total={2} format={{ style: "currency", currency: "USD" }} labels={{ of: "of {total} ($&)" }} />
      </StatGroup>,
    );
    expect(container.querySelector("dd")).toHaveTextContent("$1.00 of $2.00 ($&)");
  });

  it("renders the action as a safe link with a 24 px target, and drops an unsafe URL", async () => {
    const { container } = render(
      <StatGroup>
        <Stat label="Approvals pending" value={3} action={{ href: "/approvals", label: "Review approvals" }} />
        <Stat label="Bad" value={1} action={{ href: "javascript:alert(1)", label: "Never a link" }} />
      </StatGroup>,
    );
    const link = screen.getByRole("link", { name: "Review approvals" });
    expect(link).toHaveAttribute("href", "/approvals");
    expect(link).toHaveClass("min-h-6", "underline", "text-link");
    expect(screen.queryByRole("link", { name: "Never a link" })).toBeNull();
    expect(screen.getByText("Never a link")).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });

  it("lays out a row with hairlines by default and one column with stack", () => {
    const { container, rerender } = render(<StatGroup />);
    const dl = container.querySelector("dl")!;
    expect(dl).toHaveClass("border-t", "border-foreground", "grid-cols-2", "md:grid-flow-col");
    rerender(<StatGroup stack />);
    expect(dl).toHaveClass("grid-cols-1");
    expect(dl).not.toHaveClass("grid-cols-2");
  });
});
