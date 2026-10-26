import { fireEvent, render } from "@testing-library/react";

import { AreaChart } from "@/registry/aedis/ui/area-chart";
import { BarChart } from "@/registry/aedis/ui/bar-chart";
import { durationMs } from "@/registry/aedis/ui/chart";
import { LineChart } from "@/registry/aedis/ui/line-chart";
import { PieChart } from "@/registry/aedis/ui/pie-chart";
import { RadialChart } from "@/registry/aedis/ui/radial-chart";

const week = ["Mon", "Tue", "Wed"].map((day, i) => ({ day, a: 10 + i * 4, b: 3 + i }));
const series = [{ key: "a", label: "A" }, { key: "b", label: "B" }];

function charts(animate: boolean) {
  return (
    <>
      <BarChart title="Bars" data={week} index="day" series={series} animate={animate} />
      <LineChart title="Lines" data={week} index="day" series={series} animate={animate} />
      <AreaChart title="Areas" data={week} index="day" series={series} stacked animate={animate} />
      <PieChart title="Pie" data={week} index="day" value={{ key: "a", label: "A" }} animate={animate} />
      <RadialChart title="Radial" value={3} max={4} animate={animate} />
    </>
  );
}

/** Every geometry attribute of every mark, in document order. */
const geometry = (root: HTMLElement) =>
  [...root.querySelectorAll("svg rect, svg path, svg circle")].map((el) =>
    ["x", "y", "width", "height", "d", "cx", "cy", "r", "stroke-dasharray", "stroke-dashoffset", "transform"].map((a) => el.getAttribute(a)).join("|"),
  );

let reduce = false;
let animate: ReturnType<typeof vi.fn>;
beforeEach(() => {
  reduce = false;
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: reduce && q.includes("reduce"), addEventListener() {}, removeEventListener() {} }));
  // jsdom has no Web Animations: record what would play.
  animate = vi.fn(() => ({ cancel() {} }));
  Object.defineProperty(Element.prototype, "animate", { value: animate, configurable: true });
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete (Element.prototype as { animate?: unknown }).animate;
});

describe("chart motion", () => {
  it("draws the same final geometry with and without animation", () => {
    const moving = render(charts(true));
    const still = render(charts(false));
    expect(geometry(moving.container)).toEqual(geometry(still.container));
    expect(geometry(moving.container).length).toBeGreaterThan(10);
  });

  it("animates every mark on enter, from the tokens: bars grow, lines draw, arcs sweep, and values move", () => {
    const { container } = render(charts(true));
    const kinds = animate.mock.calls.map(([frames]) => Object.keys((frames as Record<string, unknown>[])[0])[0]);
    expect(new Set(kinds)).toEqual(new Set(["transform", "strokeDashoffset", "opacity", "strokeDasharray"]));
    expect(animate.mock.calls.every(([, options]) => (options as KeyframeAnimationOptions).fill === "backwards")).toBe(true);
    expect((container.querySelector("rect[data-enter=grow]") as SVGElement).style.transition).toContain("var(--duration-base)");
    expect((container.querySelector("path[data-enter=draw]") as SVGElement).style.transition).toContain("d var(--duration-base) var(--ease-cinematic)");
  });

  it("moves nothing under reduced motion or with animate={false}", () => {
    reduce = true;
    const { container } = render(charts(true));
    render(charts(false));
    expect(animate).not.toHaveBeenCalled();
    expect([...container.querySelectorAll<SVGElement>("[data-enter]")].every((el) => !el.style.transition)).toBe(true);
  });

  it("plays the enter animation again when the number of rows changes, and only then", () => {
    const { rerender } = render(<BarChart title="Bars" data={week} index="day" series={series} />);
    const first = animate.mock.calls.length;
    rerender(<BarChart title="Bars" data={week.map((r) => ({ ...r, a: r.a + 1 }))} index="day" series={series} />);
    expect(animate.mock.calls.length).toBe(first);
    rerender(<BarChart title="Bars" data={[...week, { day: "Thu", a: 1, b: 1 }]} index="day" series={series} />);
    expect(animate.mock.calls.length).toBeGreaterThan(first);
  });

  it("reads duration tokens in ms whatever unit the stylesheet uses (#159)", () => {
    expect(durationMs("560ms", 1)).toBe(560);
    expect(durationMs(".56s", 1)).toBe(560);
    expect(durationMs(" 0.56S ", 1)).toBe(560);
    expect(durationMs("0ms", 560)).toBe(0);
    expect(durationMs("", 560)).toBe(560);
  });

  it("caps the stagger, however many rows arrive", () => {
    const rows = Array.from({ length: 60 }, (_, i) => ({ day: `D${i}`, a: i + 1, b: 1 }));
    render(<BarChart title="Bars" data={rows} index="day" series={series} />);
    const delays = animate.mock.calls.map(([, options]) => (options as KeyframeAnimationOptions).delay ?? 0);
    expect(Math.max(...delays)).toBeLessThanOrEqual(600);
  });

  it("keeps the pie's slices where they are across hovers", () => {
    const { container } = render(<PieChart title="Pie" data={week} index="day" value={{ key: "a", label: "A" }} />);
    const offsets = () => [...container.querySelectorAll("circle[data-enter]")].map((c) => c.getAttribute("stroke-dashoffset"));
    const before = offsets();
    for (const slice of container.querySelectorAll("circle[data-enter]")) fireEvent.pointerEnter(slice);
    expect(offsets()).toEqual(before);
  });
});
