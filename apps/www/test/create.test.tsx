import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Create } from "@/components/site/create";
import { decodePreset } from "@/content/preset";

const command = (c: HTMLElement) => /init --preset ([nv][db][sml][cso][123]-[0-9a-f]{2}-[0-9a-f]{8})/.exec(c.textContent ?? "")?.[1] ?? "";

describe("Create", () => {
  it("produces a command the CLI accepts for every choice it offers", async () => {
    const user = userEvent.setup();
    const { container } = render(<Create />);
    const seen = new Set<string>();
    for (const name of ["Framework", "Theme", "Radius", "Motion"]) {
      for (const tab of within(screen.getByRole("tablist", { name })).getAllByRole("tab")) {
        await user.click(tab);
        seen.add(command(container));
        expect(decodePreset(command(container)).ok).toBe(true);
      }
    }
    for (const level of screen.getAllByRole("radio")) {
      await user.click(level);
      seen.add(command(container));
    }
    for (const block of screen.getAllByRole("checkbox")) {
      await user.click(block);
      seen.add(command(container));
    }
    expect(seen.size).toBe(15); // every click that changes a choice changes the id
    const last = decodePreset(command(container));
    expect(last.ok && last.preset).toMatchObject({ framework: "v", theme: "b", radius: "l", motion: "o", level: "3", blocks: ["secure-shell", "charts", "mf-frame"] });
  });

  it("previews the preset's theme on real components", async () => {
    const user = userEvent.setup();
    const { container } = render(<Create />);
    await user.click(within(screen.getByRole("tablist", { name: "Theme" })).getByRole("tab", { name: "Brand" }));
    const preview = container.querySelector<HTMLElement>("[style*='--primary']")!;
    expect(preview.style.getPropertyValue("--primary")).toBe("#1a2740");
    expect(preview.querySelector("[inert]")).not.toBeNull();
  });
});
