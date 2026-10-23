"use client";

import { CartesianGrid, ChartFrame, cleanRows, HitColumns, lineScale, linePath, lineX, plot, seriesColor, type CartesianChartProps } from "@/registry/aedis/ui/chart";

type AreaChartProps = CartesianChartProps & {
  /** Stack the series on top of each other, so the top line is the total. */
  stacked?: boolean;
};

/** Filled lines; a dropped value leaves a gap in its series instead of a made-up point. */
function AreaChart({ title, data, index, series, indexLabel, format, legend = series.length > 1, labels, className, stacked = false }: AreaChartProps) {
  const { rows, dropped } = cleanRows(data, index, series);
  const y = lineScale(rows, stacked);
  const x = (i: number) => lineX(i, rows.length);
  // Per series, the floor and the top of each point; stacked series start where the ones before them ended.
  const layers = series.map((_, j) =>
    rows.map((r) => {
      const v = r.values[j];
      const floor = stacked ? r.values.slice(0, j).reduce<number>((a, b) => a + (b ?? 0), 0) : 0;
      return v === null ? null : ([floor, floor + v] as const);
    }),
  );
  return (
    <ChartFrame title={title} series={series} rows={rows} dropped={dropped} indexLabel={indexLabel} format={format} legend={legend} labels={labels} className={className}>
      {({ active, hover }) => (
        <svg viewBox={`0 0 ${plot.width} ${plot.height}`} width="100%" aria-hidden="true" className="block overflow-visible">
          <CartesianGrid rows={rows} x={x} />
          {/* Last series first, so the first one is drawn on top. */}
          {[...layers.keys()].reverse().map((j) => {
            const s = series[j];
            const tops = layers[j].map((p, i) => (p ? ([x(i), y(p[1])] as const) : null));
            // Each unbroken run becomes one closed shape down to its floor.
            const runs: number[][] = [];
            layers[j].forEach((p, i) => (p ? (i > 0 && layers[j][i - 1] ? runs[runs.length - 1].push(i) : runs.push([i])) : null));
            const fill = runs.map((run) => `${linePath(run.map((i) => tops[i]))}${linePath([...run].reverse().map((i) => [x(i), y(layers[j][i]![0])] as const)).replace(/^M/, "L")}Z`).join("");
            return (
              <g key={s.key} stroke={seriesColor(s, j)} fill={seriesColor(s, j)}>
                <path d={fill} fillOpacity={0.18} stroke="none" />
                <path d={linePath(tops)} fill="none" strokeWidth={2} strokeLinejoin="round" />
                {active !== null && tops[active] ? <circle cx={tops[active]![0]} cy={tops[active]![1]} r={4} fill="var(--surface)" strokeWidth={2} /> : null}
              </g>
            );
          })}
          <HitColumns count={rows.length} hover={hover} />
        </svg>
      )}
    </ChartFrame>
  );
}

export { AreaChart };
