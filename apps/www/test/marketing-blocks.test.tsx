import { render, screen, within } from "@testing-library/react";

import { CtaSection } from "@/registry/aedis/blocks/cta-section";
import { Hero } from "@/registry/aedis/blocks/hero";
import { LogoCloud } from "@/registry/aedis/blocks/logo-cloud";
import { ProofList } from "@/registry/aedis/blocks/proof-list";
import { violations } from "./a11y";

describe("marketing blocks (#199)", () => {
  it("renders real headings and text, and leaves out actions whose URL is refused", async () => {
    const { container } = render(
      <>
        <Hero
          eyebrow="RLFN Studio"
          headline="Brands that people remember"
          lead="Identity, websites and film."
          actions={[
            { label: "See the work", href: "/work" },
            { label: "Visit", href: "https://example.com/" },
            { label: "Trap", href: "javascript:alert(1)" },
          ]}
          media={<p>media slot</p>}
        />
        <CtaSection headline="Have a project in mind?" actions={[{ label: "Data", href: "data:text/html,<script>alert(1)</script>" }, { label: "Start", href: "/contact" }]} />
      </>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Brands that people remember" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Have a project in mind?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See the work" })).toHaveAttribute("href", "/work");
    expect(screen.getByRole("link", { name: "Visit" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByText("Trap")).toBeNull();
    expect(screen.queryByText("Data")).toBeNull();
    expect(screen.getByText("media slot")).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });

  it("names every client, by its logo's alt or as text", async () => {
    const { container } = render(<LogoCloud title="Trusted by" clients={[{ name: "Bakery", logo: "/b.svg" }, { name: "Wine bar" }, { name: "School", href: "/s" }]} />);
    const list = within(screen.getByRole("region", { name: "Trusted by" })).getByRole("list");
    expect(within(list).getByRole("img", { name: "Bakery" })).toBeInTheDocument();
    expect(within(list).getByText("Wine bar")).toBeInTheDocument();
    expect(within(list).getByRole("link", { name: "School" })).toHaveAttribute("href", "/s");
    expect(await violations(container)).toEqual([]);
  });

  it("lists facts as terms with their numerals", async () => {
    const { container } = render(<ProofList items={[{ value: "12", label: "Years in practice" }, { label: "Independent", detail: "No holding." }]} />);
    const terms = screen.getAllByRole("term").map((t) => t.textContent);
    expect(terms).toEqual(["Years in practice", "Independent"]);
    expect(screen.getAllByRole("definition").map((d) => d.textContent)).toEqual(["12", "No holding."]);
    expect(await violations(container)).toEqual([]);
  });
});

describe("hero highlight (#256)", () => {
  it("ends the h1 with a highlighted line that is part of its name", async () => {
    const { container } = render(<Hero headline="Engineering for fintechs and startups," highlight="from zero to product." />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveAccessibleName("Engineering for fintechs and startups, from zero to product.");
    const span = h1.querySelector("[data-slot=hero-highlight]")!;
    expect(span).toHaveTextContent("from zero to product.");
    expect(span).toHaveClass("block", "text-highlight");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(await violations(container)).toEqual([]);
    render(<Hero headline="Plain" />);
    expect(screen.getByRole("heading", { name: "Plain" }).querySelector("[data-slot=hero-highlight]")).toBeNull();
  });

});

