import { render, screen } from "@testing-library/react";
import fc from "fast-check";

import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { es } from "@/registry/aedis/lib/locales/es";
import { Citation, Sources, sourceDomain } from "@/registry/aedis/ui/sources";
import { violations } from "./a11y";

const sources = [
  { title: "Pricing policy 2026", url: "https://www.acme.com/docs/pricing", snippet: "Shoot days are billed monthly." },
  { title: "Аcme login\u202E", url: "https://xn--cme-8cd.com/login" },
  { title: "Evil", url: "javascript:alert(1)" },
  { title: "Internal note", url: "/notes/42" },
];

describe("sourceDomain", () => {
  it("shows the real host, in punycode for international names, and nothing for refused or relative URLs", () => {
    expect(sourceDomain("https://www.acme.com/a")).toBe("acme.com");
    expect(sourceDomain("https://аcme.com/login")).toBe("xn--cme-5cd.com");
    expect(sourceDomain("javascript:alert(1)")).toBeNull();
    expect(sourceDomain("/notes/42")).toBeNull();
  });

  it("is always ASCII (property)", () => {
    fc.assert(fc.property(fc.webUrl({ withFragments: true, withQueryParameters: true }), (url) => {
      const d = sourceDomain(url);
      if (d !== null) expect(/^[\x21-\x7E]+$/.test(d)).toBe(true);
    }));
  });
});

describe("Sources", () => {
  it("lists safe, marked links with their domain, as text, and fetches no favicon", async () => {
    const { container } = render(<Sources sources={sources} idPrefix="ans1" />);
    expect(screen.getByRole("region", { name: "Sources" })).toBeInTheDocument();
    const pricing = screen.getByRole("link", { name: "Pricing policy 2026 (external site)" });
    expect(pricing).toHaveAttribute("rel", "noopener noreferrer");
    expect(pricing).toHaveAttribute("target", "_blank");
    expect(screen.getByText("acme.com")).toBeInTheDocument();
    expect(screen.getByText("xn--cme-8cd.com")).toBeInTheDocument();
    expect(container.textContent).not.toContain("\u202E");
    expect(screen.queryByRole("link", { name: /Evil/ })).toBeNull();
    expect(screen.getByRole("link", { name: "Internal note" })).toHaveAttribute("href", "/notes/42");
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("#ans1-2")).not.toBeNull();
    expect(await violations(container)).toEqual([]);
  });

  it("links inline citations to their entry with an accessible name, in the reader's language", () => {
    render(
      <LocaleProvider locale="es" messages={es}>
        <p>
          Billed monthly<Citation n={1} idPrefix="ans1" title="Pricing policy 2026" />
        </p>
        <Sources sources={sources.slice(0, 1)} idPrefix="ans1" />
      </LocaleProvider>,
    );
    expect(screen.getByRole("link", { name: "Fuente 1: Pricing policy 2026" })).toHaveAttribute("href", "#ans1-1");
    expect(screen.getByRole("region", { name: "Fuentes" })).toBeInTheDocument();
  });

  it("generates its own anchor prefix", () => {
    const { container } = render(<Sources sources={sources.slice(0, 1)} />);
    expect(container.querySelector("li")!.id).toMatch(/^source.+-1$/);
  });
});
