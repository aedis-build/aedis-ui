import { render } from "@testing-library/react";

import { fitPath, ScrollPath, scrollPathPresets } from "@/registry/aedis/ui/scroll-path";
import { violations } from "./a11y";

describe("scroll path (#245)", () => {
  it("draws a preset or a path of its own in a lane beside the content, hidden from screen readers", async () => {
    const { container, rerender } = render(
      <ScrollPath>
        <p>What we do</p>
      </ScrollPath>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-lane", "left");
    expect(root.style.getPropertyValue("--lane")).toBe("40%");
    expect(root.className).toContain("grid-cols-[var(--lane)_minmax(0,1fr)]");
    expect(container.querySelector("path")).toHaveAttribute("d", scrollPathPresets.wave);
    expect(container.querySelector("[data-slot=scroll-path-lane]")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("[data-slot=scroll-path-lane]")).toHaveAttribute("data-slot", "scroll-path-lane");
    expect(await violations(container)).toEqual([]);

    rerender(
      <ScrollPath lane="right" laneWidth={0.25} d="M0 0L100 100" strokeWidth={3} opacity={0.3}>
        <p>What we do</p>
      </ScrollPath>,
    );
    expect(root.className).toContain("grid-cols-[minmax(0,1fr)_var(--lane)]");
    expect(root.style.getPropertyValue("--lane")).toBe("25%");
    expect(container.querySelector("[data-slot=scroll-path-lane]")!.className).toContain("order-last");
    expect(container.querySelector("path")).toHaveAttribute("d", "M0 0L100 100");
    expect(container.querySelector("path")).toHaveAttribute("stroke-width", "3");
    expect(container.querySelector("svg")).toHaveStyle({ opacity: "0.3" });
  });

  it("draws the line at the lane's own size, scaling its x,y pairs, so the dashes are never stretched", () => {
    expect(fitPath("M50 0 C10 15, 90 30, 50 45", 200, 600)).toBe("M100 0 C20 90, 180 180, 100 270");
    expect(fitPath("M0.5,1 L100 100", 333, 77)).toBe("M1.7 0.8 L333 77");
    const spy = vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ width: 200, height: 600 }) as DOMRect);
    const { container } = render(
      <ScrollPath d="M0 0 L100 100">
        <p>x</p>
      </ScrollPath>,
    );
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", "0 0 200 600");
    expect(container.querySelector("path")).toHaveAttribute("d", "M0 0 L200 600");
    spy.mockRestore();
  });

  it("warns in development when a full-lane line crosses text, and not when the text is clear of it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const rect = (left: number, top: number, w: number, h: number) => () => ({ left, top, right: left + w, bottom: top + h, width: w, height: h }) as DOMRect;
    const spies = [
      vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockImplementation(rect(0, 0, 400, 400)),
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(rect(100, 100, 200, 20)),
    ];
    render(
      <ScrollPath lane="full">
        <p>Under the line</p>
      </ScrollPath>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Under the line"));
    warn.mockClear();
    spies[1]!.mockImplementation(rect(500, 100, 200, 20));
    render(
      <ScrollPath lane="full">
        <p>Beside it</p>
      </ScrollPath>,
    );
    expect(warn).not.toHaveBeenCalled();
    spies.forEach((s) => s.mockRestore());
    warn.mockRestore();
  });
});
