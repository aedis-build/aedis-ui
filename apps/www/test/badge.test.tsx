import { render, screen } from "@testing-library/react";

import { contrast } from "@/registry/aedis/lib/contrast";
import { colors, themeNames } from "@/registry/aedis/lib/tokens";
import { Badge } from "@/registry/aedis/ui/badge";
import { violations } from "./a11y";

describe("badge status variant (#276)", () => {
  it("draws a hidden dot per tone and keeps the meaning in the text", async () => {
    const { container } = render(
      <>
        <Badge variant="status" tone="ok">
          Up to date
        </Badge>
        <Badge variant="status" tone="attention">
          1 warning
        </Badge>
        <Badge variant="status">Draft</Badge>
      </>,
    );
    const dots = container.querySelectorAll("[data-slot=badge-dot]");
    expect([...dots].map((d) => d.getAttribute("data-tone"))).toEqual(["ok", "attention", "neutral"]);
    for (const d of dots) expect(d).toHaveAttribute("aria-hidden", "true");
    expect(dots[0]).toHaveClass("bg-success", "size-1.5", "rounded-full");
    expect(dots[1]).toHaveClass("bg-warning");
    expect(dots[2]).toHaveClass("bg-muted-foreground");
    expect(screen.getByText("Up to date")).toHaveClass("text-foreground", "rounded-full");
    expect(screen.getByText("1 warning")).not.toHaveClass("bg-success", "bg-warning");
    expect(await violations(container)).toEqual([]);
  });

  it("draws no dot for the other variants", () => {
    const { container } = render(<Badge tone="ok">Junior</Badge>);
    expect(container.querySelector("[data-slot=badge-dot]")).toBeNull();
  });

  it.each(themeNames)("%s: text 4.5:1 and dot 3:1 against the surfaces a badge sits on", (theme) => {
    const failing = (["background", "surface"] as const).flatMap((bg) =>
      [
        { fg: "foreground" as const, min: 4.5 },
        { fg: "success" as const, min: 3 },
        { fg: "warning" as const, min: 3 },
        { fg: "muted-foreground" as const, min: 3 },
      ]
        .map(({ fg, min }) => ({ pair: `${fg} on ${bg}`, min, ratio: contrast(colors[fg][theme], colors[bg][theme], colors.background[theme]) }))
        .filter((p) => p.ratio < p.min),
    );
    expect(failing).toEqual([]);
  });
});
