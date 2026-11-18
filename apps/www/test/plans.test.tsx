import { fireEvent, render, screen, within } from "@testing-library/react";

import PlansDemo from "@/examples/blocks/plans";
import { Plans } from "@/registry/aedis/blocks/plans";
import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { violations } from "./a11y";

const plans = [
  { id: "free", name: "Free", price: 0, items: ["1 agent"] },
  { id: "pro", name: "Pro", price: 299.5, period: "per month", items: ["10 agents"], action: { label: "Switch to Pro", href: "/billing/pro" } },
  { id: "trap", name: "Trap", price: 1, action: { label: "Switch to Trap", href: "javascript:alert(1)" } },
  { id: "managed", name: "Managed", price: "Talk to us", action: { label: "Talk to us about Managed", href: "https://example.com/" } },
];

describe("plans (#282)", () => {
  it("is a section per plan named by its heading, and states the current plan in text", async () => {
    const { container } = render(<Plans plans={plans} current="free" currency="BRL" locale="pt-BR" />);
    const free = screen.getByRole("region", { name: "Free" });
    expect(within(free).getByRole("heading", { level: 2, name: "Free" })).toBeInTheDocument();
    expect(within(free).getByText("Current plan")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Pro" })).queryByText("Current plan")).toBeNull();
    expect(await violations(container)).toEqual([]);
  });

  it("formats prices from amount, currency and locale, and shows text prices as given", () => {
    const { rerender } = render(<Plans plans={plans} currency="BRL" locale="pt-BR" />);
    const text = (name: string) => screen.getByRole("region", { name }).textContent;
    expect(text("Free")).toContain(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", trailingZeroDisplay: "stripIfInteger" }).format(0));
    expect(text("Pro")).toContain("R$ 299,50");
    expect(text("Managed")).toContain("Talk to us");
    rerender(<Plans plans={plans} currency="USD" locale="en-US" />);
    expect(text("Pro")).toContain("$299.50");
  });

  it("names actions in full and leaves out an action whose URL is refused", () => {
    render(<Plans plans={plans} current="free" currency="USD" />);
    expect(screen.getByRole("link", { name: "Switch to Pro" })).toHaveAttribute("href", "/billing/pro");
    expect(screen.getByRole("link", { name: "Talk to us about Managed" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByText("Switch to Trap")).toBeNull();
  });

  it("marks the current plan with an inset shadow in a fixed title row, so the grid does not move", () => {
    const { container, rerender } = render(<Plans plans={plans} current="free" currency="USD" />);
    const sections = () => [...container.querySelectorAll("section")];
    const classes = () => sections().map((s) => s.className.replace(/shadow-\S+/, ""));
    const before = classes();
    expect(sections()[0]).toHaveAttribute("data-current", "true");
    expect(sections()[0]!.className).toContain("shadow-[inset_0_2px_0_var(--accent)]");
    expect(sections()[1]!.className).toContain("shadow-[inset_0_1px_0_var(--hairline)]");
    for (const s of sections()) {
      expect(s.className).not.toMatch(/\bborder/);
      expect(s.querySelector("[data-slot=plan-title]")).toHaveClass("h-7");
    }
    rerender(<Plans plans={plans} current="pro" currency="USD" />);
    expect(classes()).toEqual(before);
    expect(sections()[1]).toHaveAttribute("data-current", "true");
  });

  it("puts plan headings under a title, and reads the tag from the locale or labels", async () => {
    const { container, rerender } = render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <Plans title="Plano e cobrança" plans={plans} current="pro" currency="BRL" />
      </LocaleProvider>,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Pro" })).toBeInTheDocument();
    expect(screen.getByText("Plano atual")).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
    rerender(<Plans plans={plans} current="pro" currency="BRL" labels={{ current: "You are here" }} />);
    expect(screen.getByText("You are here")).toBeInTheDocument();
  });

  it("demo: switches currency and plan in place", async () => {
    const { container } = render(<PlansDemo />);
    expect(within(screen.getByRole("region", { name: "Pro" })).getByText(/R\$/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Switch to Pro" }));
    expect(within(screen.getByRole("region", { name: "Pro" })).getByText("Current plan")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Switch to Pro" })).toBeNull();
    expect(screen.getByRole("button", { name: "Switch to Start" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "USD" }));
    expect(within(screen.getByRole("region", { name: "Pro" })).getByText("$59")).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });
});
