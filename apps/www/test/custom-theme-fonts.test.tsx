import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CustomThemeFonts from "@/examples/custom-theme/fonts";
import { violations } from "./a11y";

describe("theme fonts (#202)", () => {
  it("writes the font variables for a family, and refuses one that is not a plain name", async () => {
    const user = userEvent.setup();
    const { container } = render(<CustomThemeFonts />);
    const out = screen.getByRole("status", { name: "Theme fonts" });
    expect(out).toHaveTextContent("--font-display: ui-serif");
    await user.type(screen.getByRole("textbox", { name: "Self-hosted display family" }), "Fraunces");
    expect(out).toHaveTextContent('--font-display: "Fraunces", -apple-system');
    await user.type(screen.getByRole("textbox", { name: "Self-hosted display family" }), "; }");
    expect(out).toHaveTextContent("fonts.display must be one of");
    expect(await violations(container)).toEqual([]);
  });
});
