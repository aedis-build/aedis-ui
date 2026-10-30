import { render, screen } from "@testing-library/react";

import { InlineMarkdown } from "@/components/site/inline-markdown";
import { Card, CardHeader, CardTitle } from "@/registry/aedis/ui/card";

// #239: Lighthouse on the showcase (axe link-in-text-block, heading-order).
describe("links in running text and card headings", () => {
  it("underlines a link inside text all the time, not only on hover", () => {
    render(<p>Sanitized by <InlineMarkdown text="`Markdown`, see [the guide](/docs/theming)." /></p>);
    for (const name of ["Markdown", "the guide"]) {
      const link = screen.getByRole("link", { name });
      expect(link.className.split(" ")).toContain("underline");
      expect(link.className).not.toContain("hover:underline");
    }
  });

  it("lets a card title take the level the page outline needs, h3 by default", () => {
    render(
      <>
        <Card><CardHeader><CardTitle>Default</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardTitle as="h2">Under the page heading</CardTitle></CardHeader></Card>
      </>,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Default" })).toHaveAttribute("data-slot", "card-title");
    expect(screen.getByRole("heading", { level: 2, name: "Under the page heading" })).toHaveClass("text-headline");
  });
});
