import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Typeset } from "@/components/site/typeset";
import { parseThemeJson } from "@/registry/aedis/lib/custom-theme";

describe("Typeset", () => {
  it("gives a theme the validator accepts for every choice, and its CSS variables", async () => {
    const user = userEvent.setup();
    const { container } = render(<Typeset />);
    const groups = ["Font", "Base size", "Scale", "Line height of body"];
    for (const name of groups) {
      for (const tab of within(screen.getByRole("tablist", { name })).getAllByRole("tab")) {
        await user.click(tab);
        expect(screen.getByText(/^Valid theme: aedis theme import accepts it.$/)).toHaveAttribute("role", "status");
        const json = [...container.querySelectorAll("[data-slot=code-block]")].find((b) => b.textContent?.includes('"version"'))!.querySelector("pre")!.textContent!;
        expect(parseThemeJson(json).ok).toBe(true);
      }
    }
    expect(container.textContent).toContain("--text-body--line-height: 1.7;");
    expect(container.textContent).toContain("--font-sans: ui-serif");
  }, 15_000); // clicks through every choice: room above the 5 s default when the suite runs in parallel

  it("renders the prose through Markdown, so its raw HTML never becomes markup", () => {
    const { container } = render(<Typeset />);
    const prose = container.querySelector("[data-slot=markdown]")!;
    expect(prose.querySelector("b, [onclick]")).toBeNull();
    expect(prose.textContent).toContain("This tag is not rendered.");
  });
});
