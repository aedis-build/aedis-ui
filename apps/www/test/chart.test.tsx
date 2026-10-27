import { fireEvent, render, screen } from "@testing-library/react";
import fc from "fast-check";

import { contrast } from "@/registry/aedis/lib/contrast";
import { colors, themeNames } from "@/registry/aedis/lib/tokens";
import { AreaChart } from "@/registry/aedis/ui/area-chart";
import { BarChart } from "@/registry/aedis/ui/bar-chart";
import { cleanRows, MAX_ROWS, niceMax, plot, seriesColor } from "@/registry/aedis/ui/chart";
import { LineChart } from "@/registry/aedis/ui/line-chart";
import { PieChart } from "@/registry/aedis/ui/pie-chart";
import { RadialChart } from "@/registry/aedis/ui/radial-chart";
import { violations } from "./a11y";

const XSS = "<img src=x onerror=alert(1)>";
const series = [{ key: "a", label: "Approved" }, { key: "b", label: XSS }];
const week = ["Mon", "Tue", "Wed"].map((day, i) => ({ day, a: 10 + i, b: 4 + i }));

describe("charts", () => {
  it("says when there is nothing to draw, and drops the legend (#159)", () => {
    render(<BarChart title="Bars" data={[]} index="day" series={series} />);
    expect(screen.getByText("No data to show.")).toBeVisible();
    expect(document.querySelector("[data-slot=chart-legend]")).toBeNull();
  });

  it("render names, ticks, tooltips and the center as text, never as markup", () => {
    const data = [{ day: XSS, a: 3, b: 1 }];
    const { container } = render(
      <>
        <BarChart title="Bars" data={data} index="day" series={series} />
        <AreaChart title="Areas" data={data} index="day" series={series} stacked />
        <LineChart title="Lines" data={data} index="day" series={series} />
        <PieChart title="Pie" data={data} index="day" value={{ key: "a", label: XSS }} center={XSS.slice(0, 12)} />
        <RadialChart title={XSS} value={1} max={2} caption={XSS} />
      </>,
    );
    fireEvent.keyDown(screen.getByRole("group", { name: "Bars" }), { key: "ArrowRight" });
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("group", { name: "Bars" }).textContent).toContain(XSS);
    expect(screen.getAllByRole("table")[0].textContent).toContain(XSS);
    expect(container.querySelector("[data-slot=chart-ticks]")?.textContent).toBe(XSS);
  });

  it("drop and count every value that is not a finite number in range (property)", () => {
    const value = fc.oneof(fc.double(), fc.integer(), fc.constantFrom(Number.NaN, Infinity, -Infinity, -1, 1e300), fc.string(), fc.constant(null), fc.anything());
    fc.assert(
      fc.property(fc.array(fc.record({ k: fc.anything(), a: value, b: value }), { maxLength: 30 }), (rows) => {
        const { rows: clean, dropped } = cleanRows(rows, "k", series, 0, 1e6);
        const kept = clean.flatMap((r) => r.values).filter((v) => v !== null);
        expect(kept.every((v) => Number.isFinite(v) && v! >= 0 && v! <= 1e6)).toBe(true);
        expect(kept.length + dropped).toBe(rows.length * series.length);
        expect(clean.every((r) => typeof r.label === "string")).toBe(true);
      }),
    );
  });

  it("never draw outside the canvas, whatever the data (property)", () => {
    const value = fc.oneof(fc.double(), fc.constantFrom(Number.NaN, Infinity, -5, 5e-324, Number.MAX_VALUE), fc.string());
    fc.assert(
      fc.property(fc.array(fc.record({ day: fc.string(), a: value, b: value }), { minLength: 1, maxLength: 12 }), (rows) => {
        const { container, unmount } = render(
          <>
            <BarChart title="Bars" data={rows} index="day" series={series} />
            <LineChart title="Lines" data={rows} index="day" series={series} />
            <AreaChart title="Areas" data={rows} index="day" series={series} stacked />
          </>,
        );
        const within = (n: string | null) => n === null || (Number.isFinite(Number(n)) && Number(n) >= -0.01 && Number(n) <= plot.height + 0.01);
        for (const r of container.querySelectorAll("rect[fill^='var(--chart']")) {
          expect(within(r.getAttribute("y")) && within(r.getAttribute("height"))).toBe(true);
        }
        for (const c of container.querySelectorAll("circle")) expect(within(c.getAttribute("cy"))).toBe(true);
        for (const p of container.querySelectorAll("path")) expect(p.getAttribute("d") ?? "").not.toMatch(/NaN|Infinity/);
        unmount();
      }),
      { numRuns: 40 },
    );
  });

  it("say how many values were dropped and cap the rows", () => {
    render(<BarChart title="Bars" data={[{ day: "Mon", a: Number.NaN, b: "7" }, { day: "Tue", a: 2, b: -1 }]} index="day" series={series} />);
    expect(screen.getByText("3 values not shown: not a number in range.")).toBeInTheDocument();
    const many = Array.from({ length: MAX_ROWS + 10 }, (_, i) => ({ k: String(i), a: 1, b: 1 }));
    expect(cleanRows(many, "k", series)).toMatchObject({ dropped: 20 });
    expect(cleanRows(many, "k", series).rows).toHaveLength(MAX_ROWS);
    expect(cleanRows([{ k: { toString: 1 }, a: 1, b: 1 }, { k: 7, a: 1, b: 1 }], "k", series).rows.map((r) => r.label)).toEqual(["", "7"]);
  });

  it("take series colors from theme tokens that pass 3:1 on surface and background in every theme", () => {
    expect(seriesColor({ key: "a", label: "A" }, 0)).toBe("var(--chart-1)");
    expect(seriesColor({ key: "a", label: "A" }, 6)).toBe("var(--chart-2)");
    expect(seriesColor({ key: "a", label: "A", color: 4 }, 0)).toBe("var(--chart-4)");
    for (const theme of themeNames) {
      for (const c of ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const) {
        expect(contrast(colors[c][theme], colors.surface[theme]), `${c} ${theme}`).toBeGreaterThanOrEqual(3);
        expect(contrast(colors[c][theme], colors.background[theme]), `${c} ${theme}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("have a data table for screen readers and a tooltip reachable by keyboard", async () => {
    const { container } = render(<BarChart title="Approvals per day" indexLabel="Day" data={week} index="day" series={series.slice(0, 1)} />);
    const table = screen.getByRole("table", { name: "Approvals per day" });
    expect(table.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(screen.getByRole("columnheader", { name: "Day" })).toBeInTheDocument();
    const plotArea = screen.getByRole("group", { name: "Approvals per day" });
    expect(plotArea).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(plotArea, { key: "End" });
    expect(container.querySelector("[data-slot=chart-tooltip]")?.textContent).toBe("WedApproved12");
    fireEvent.keyDown(plotArea, { key: "ArrowLeft" });
    expect(container.querySelector("[data-slot=chart-tooltip]")?.textContent).toContain("Tue");
    fireEvent.keyDown(plotArea, { key: "Escape" });
    expect(container.querySelector("[data-slot=chart-tooltip]")).toBeNull();
    expect(await violations(container)).toEqual([]);
  });

  it("show the row under the pointer", () => {
    const { container } = render(<LineChart title="Lines" data={week} index="day" series={series.slice(0, 1)} />);
    fireEvent.pointerEnter(container.querySelectorAll("rect[fill=transparent]")[1]);
    expect(container.querySelector("[data-slot=chart-tooltip]")?.textContent).toContain("Tue");
  });

  it("keep the radial ring empty for a value out of range, and the pie empty with nothing to share", () => {
    const { container } = render(
      <>
        <RadialChart title="Over" value={2000} max={1500} />
        <RadialChart title="No max" value={1} max={Number.NaN} />
        <PieChart title="Nothing" data={[{ m: "A", v: 0 }, { m: "B", v: -3 }]} index="m" value={{ key: "v", label: "V" }} />
      </>,
    );
    expect(container.querySelectorAll("circle[stroke^='var(--chart']")).toHaveLength(0);
    expect(screen.getAllByText(/values? not shown/)).toHaveLength(3);
  });

  it("round the axis up to a readable number", () => {
    expect([niceMax(0), niceMax(7), niceMax(12), niceMax(23), niceMax(420), niceMax(0.3)]).toEqual([1, 10, 20, 25, 500, 0.5]);
    expect([niceMax(5e-324), niceMax(Number.MAX_VALUE)]).toEqual([5e-324, Number.MAX_VALUE]);
  });
});
