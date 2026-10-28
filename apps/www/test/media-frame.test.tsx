import { fireEvent, render, screen } from "@testing-library/react";

import { MediaFrame } from "@/registry/aedis/ui/media-frame";
import { violations } from "./a11y";

describe("media frame (#194)", () => {
  it("reserves its ratio and renders a lazy image with its alt", async () => {
    const { container } = render(<MediaFrame ratio="4:5" src="/media/work-1.svg" alt="Shop sign" />);
    const frame = container.querySelector("[data-slot=media-frame]")!;
    expect(frame.className).toContain("aspect-[4/5]");
    const img = screen.getByRole("img", { name: "Shop sign" });
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img.className).toContain("object-cover");
    expect(await violations(container)).toEqual([]);
  });

  it("shows a labelled placeholder while the media is missing, and when it fails to load", async () => {
    const { container, rerender } = render(<MediaFrame alt="Hotel campaign" caption="Photos coming soon" />);
    expect(screen.getByRole("img", { name: "Hotel campaign: Photos coming soon" })).toHaveTextContent("Photos coming soon");
    expect(await violations(container)).toEqual([]);
    rerender(<MediaFrame src="/missing.png" alt="Hotel campaign" />);
    fireEvent.error(screen.getByRole("img", { name: "Hotel campaign" }));
    expect(container.querySelector("[data-slot=media-frame-placeholder]")).toHaveAttribute("role", "img");
  });

  it("gives a decorative frame an empty alt and hides its placeholder", () => {
    const { container } = render(<MediaFrame decorative src="/media/work-2.svg" />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    const { container: empty } = render(<MediaFrame decorative />);
    expect(empty.querySelector("[data-slot=media-frame-placeholder]")).toHaveAttribute("aria-hidden", "true");
  });

  it("hands the image to a framework component", () => {
    render(<MediaFrame src="/a.png" alt="A" image={(p) => <img {...p} data-framework="" />} />);
    expect(screen.getByRole("img", { name: "A" })).toHaveAttribute("data-framework");
  });

  it("requires alt unless decorative, in the type", () => {
    // @ts-expect-error alt is required
    void (<MediaFrame src="/a.png" />);
    // @ts-expect-error a decorative frame takes no alt
    void (<MediaFrame decorative alt="x" />);
  });
});
