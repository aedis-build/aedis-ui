import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

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

  it("reserves the vertical presets and any ratio from width and height or a number (#272)", async () => {
    const frame = (el: ReactElement) => render(el).container.querySelector<HTMLElement>("[data-slot=media-frame]")!;
    expect(frame(<MediaFrame ratio="2:3" alt="Plate" />).className).toContain("aspect-[2/3]");
    expect(frame(<MediaFrame ratio="9:16" alt="Reel" />).className).toContain("aspect-[9/16]");
    const measured = frame(<MediaFrame ratio="16:9" width={1080} height={1350} src="/a.png" alt="Dish" />);
    expect(measured.style.aspectRatio).toBe("1080 / 1350");
    expect(measured.className).not.toContain("aspect-");
    expect(frame(<MediaFrame ratio={0.8} alt="Menu" />).style.aspectRatio).toBe("0.8 / 1");
    // Bad item data falls back to the preset instead of a frame with no height.
    const bad = frame(<MediaFrame width={0} height={Number.NaN} ratio={-1} alt="Broken" />);
    expect(bad.style.aspectRatio).toBe("");
    expect(bad.className).toContain("aspect-[3/2]");
    const { container } = render(<MediaFrame width={3} height={4} alt="Chef" caption="Photo coming soon" />);
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
