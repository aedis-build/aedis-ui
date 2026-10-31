import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";

import { ScrollSteps } from "@/registry/aedis/ui/scroll-steps";
import { violations } from "./a11y";

const items = [
  { meta: "Weeks 1–2", title: "Listen", text: "With the team." },
  { title: "Shape" },
  { title: "Build", text: "Ready to run." },
];

function reducedMotion(on: boolean) {
  window.matchMedia = ((q: string) => ({ matches: on && q.includes("reduce"), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}

type Made = { el: Element; keyframes: Keyframe[]; options: KeyframeAnimationOptions & { timeline?: { subject: Element; inset?: string }; rangeStart?: string; rangeEnd?: string } };
let made: Made[] = [];
beforeEach(() => {
  made = [];
  reducedMotion(false);
  Element.prototype.animate = function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    made.push({ el: this, keyframes, options } as Made);
    return { cancel() {}, pause() {} } as unknown as Animation;
  } as Element["animate"];
  (window as { ViewTimeline?: unknown }).ViewTimeline = class {
    subject: Element;
    inset?: string;
    constructor(o: { subject: Element; inset?: string }) {
      this.subject = o.subject;
      this.inset = o.inset;
    }
  };
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
});
afterEach(() => {
  delete (Element.prototype as Partial<Element>).animate;
  delete (window as { ViewTimeline?: unknown }).ViewTimeline;
});

describe("scroll steps (#244)", () => {
  it("is an ordered list, every step done before JavaScript, with the line hidden from screen readers", async () => {
    const html = renderToString(<ScrollSteps items={items} />);
    expect(html.match(/data-state="done"/g)).toHaveLength(3);
    const { container } = render(<ScrollSteps items={items} end={{ title: "How to hire us", children: <p>Three ways.</p> }} />);
    expect(container.querySelectorAll("ol > li")).toHaveLength(4);
    expect(container.querySelector("li[data-end]")).toHaveTextContent("How to hire usThree ways.");
    expect(container.querySelector("[data-slot=scroll-steps-line]")).toHaveAttribute("aria-hidden", "true");
    expect(await violations(container)).toEqual([]);
  });

  it("fills the line from the first node to the last as each passes one reading head, against the whole viewport", () => {
    const { container } = render(<ScrollSteps items={items} head={0.55} />);
    const fill = made.find((m) => (m.el as HTMLElement).parentElement?.dataset.slot === "scroll-steps-line")!;
    expect(fill.keyframes).toEqual([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }]);
    expect(fill.options.rangeStart).toBe("cover 45svh");
    expect(fill.options.rangeEnd).toBe("cover calc(100% - 55svh)");
    expect(fill.options.timeline!.subject).toBe(container.querySelector("[data-slot=scroll-steps-line]"));
    expect(fill.options.timeline!.inset).toBe("0px");
  });

  it("marks a step done exactly when its node's centre passes the head, and pending again above it", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<ScrollSteps items={items} head={0.5} />);
      const nodes = [...container.querySelectorAll("[data-slot=scroll-step-node]")];
      const rows = () => [...container.querySelectorAll("ol > li")].map((li) => li.getAttribute("data-state"));
      // The head is at 400 px; a node's centre is 14 px below its top.
      const place = (tops: number[]) =>
        act(() => {
          nodes.forEach((n, i) => (n.getBoundingClientRect = () => ({ top: tops[i]!, height: 28 }) as DOMRect));
          window.dispatchEvent(new Event("scroll"));
          vi.runOnlyPendingTimers();
        });
      place([300, 386, 500]);
      expect(rows()).toEqual(["done", "done", "pending"]);
      place([300, 387, 500]);
      expect(rows()).toEqual(["done", "pending", "pending"]);
      place([900, 1000, 1100]);
      expect(rows()).toEqual(["pending", "pending", "pending"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("is all done with a full line under reduced motion", () => {
    reducedMotion(true);
    const { container } = render(<ScrollSteps items={items} />);
    expect([...container.querySelectorAll("ol > li")].every((li) => li.getAttribute("data-state") === "done")).toBe(true);
    expect(made).toHaveLength(0);
  });

  it("measures the line from the first node's centre to the last one's", () => {
    const { container } = render(<ScrollSteps items={items} />);
    const ol = container.querySelector("ol")!;
    const nodes = [...container.querySelectorAll("[data-slot=scroll-step-node]")];
    ol.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
    nodes.forEach((n, i) => (n.getBoundingClientRect = () => ({ top: 100 + i * 120 }) as DOMRect));
    let resize: () => void = () => {};
    vi.stubGlobal("ResizeObserver", class { constructor(cb: () => void) { resize = cb; } observe() {} disconnect() {} });
    const { container: c2 } = render(<ScrollSteps items={items} />);
    const ol2 = c2.querySelector("ol")!;
    ol2.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
    [...c2.querySelectorAll("[data-slot=scroll-step-node]")].forEach((n, i) => (n.getBoundingClientRect = () => ({ top: 100 + i * 120 }) as DOMRect));
    act(() => resize());
    const line = c2.querySelector<HTMLElement>("[data-slot=scroll-steps-line]")!;
    expect([line.style.top, line.style.height]).toEqual(["14px", "240px"]);
    vi.unstubAllGlobals();
    expect(ol).toBeInTheDocument();
  });
});
