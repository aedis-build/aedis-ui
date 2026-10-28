"use client";

import { CartesianGrid, ChartFrame, cleanRows, HitColumns, lineScale, linePath, lineX, moveOn, plot, seriesColor, useChartMotion, XTicks, type CartesianChartProps } from "@/registry/aedis/ui/chart";

type AreaChartProps = CartesianChartProps & {
  /** Stack the series on top of each other, so the top line is the total. */
  stacked?: boolean;
};

/** Filled lines; a dropped value leaves a gap in its series instead of a made-up point. */
function AreaChart({ title, data, index, series, indexLabel, format, legend = series.length > 1, labels, className, stacked = false, animate = true }: AreaChartProps) {
  const { rows, dropped } = cleanRows(data, index, series);
  const { ref, moves } = useChartMotion(animate, rows.length);
  const y = lineScale(rows, stacked);
  const x = (i: number) => lineX(i, rows.length);
  // Per series, the floor and the top of each point; stacked series start where the ones before them ended.
  const layers = series.map((s, j) => ({
    s,
    j,
    points: rows.map((r) => {
      const v = r.values[j];
      const floor = stacked ? r.values.slice(0, j).reduce<number>((a, b) => a + (b ?? 0), 0) : 0;
      return v == null ? null : ([floor, floor + v] as const);
    }),
  }));
  return (
    <ChartFrame title={title} series={series} rows={rows} dropped={dropped} indexLabel={indexLabel} format={format} legend={legend} labels={labels} className={className}>
      {({ active, hover }) => (
        <>
          <svg ref={ref} viewBox={`0 0 ${plot.width} ${plot.height}`} width="100%" aria-hidden="true" className="block overflow-visible">
            <CartesianGrid />
            {/* Last series first, so the first one is drawn on top. */}
            {[...layers].reverse().map(({ s, j, points }) => {
              const tops = points.map((p, i) => (p ? ([x(i), y(p[1])] as const) : null));
              // Each unbroken run becomes one closed shape down to its floor.
              const runs: { top: (readonly [number, number])[]; floor: (readonly [number, number])[] }[] = [];
              points.forEach((p, i) => {
                if (!p) return;
                const run = i > 0 && points[i - 1] ? runs.at(-1) : undefined;
                const at = { top: [x(i), y(p[1])] as const, floor: [x(i), y(p[0])] as const };
                if (run) (run.top.push(at.top), run.floor.push(at.floor));
                else runs.push({ top: [at.top], floor: [at.floor] });
              });
              const fill = runs.map((run) => `${linePath(run.top)}${linePath([...run.floor].reverse()).replace(/^M/, "L")}Z`).join("");
              const dot = active === null ? null : tops[active];
              return (
                <g key={s.key} stroke={seriesColor(s, j)} fill={seriesColor(s, j)}>
                  <path d={fill} fillOpacity={0.18} stroke="none" data-enter="fade" style={moveOn(moves, "d")} />
                  <path d={linePath(tops)} fill="none" strokeWidth={2} strokeLinejoin="round" pathLength={1} strokeDasharray={1} data-enter="draw" style={moveOn(moves, "d")} />
                  {dot ? <circle cx={dot[0]} cy={dot[1]} r={4} fill="var(--surface)" strokeWidth={2} /> : null}
                </g>
              );
            })}
            <HitColumns count={rows.length} hover={hover} />
          </svg>
          <XTicks rows={rows} x={x} />
        </>
      )}
    </ChartFrame>
  );
}

export { AreaChart };
