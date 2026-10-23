"use client";

import { CartesianGrid, ChartFrame, cleanRows, HitColumns, niceMax, plot, seriesColor, type CartesianChartProps } from "@/registry/aedis/ui/chart";

/** Bars per row, grouped side by side when there is more than one series. */
function BarChart({ title, data, index, series, indexLabel, format, legend = series.length > 1, labels, className }: CartesianChartProps) {
  const { rows, dropped } = cleanRows(data, index, series);
  const top = niceMax(Math.max(0, ...rows.flatMap((r) => r.values.map((v) => v ?? 0))));
  const band = plot.width / Math.max(1, rows.length);
  const group = band * 0.72;
  const bar = Math.max(1, group / series.length - (series.length > 1 ? 4 : 0));
  const y = (v: number) => plot.bottom - (v / top) * (plot.bottom - plot.top);
  return (
    <ChartFrame title={title} series={series} rows={rows} dropped={dropped} indexLabel={indexLabel} format={format} legend={legend} labels={labels} className={className}>
      {({ active, hover }) => (
        <svg viewBox={`0 0 ${plot.width} ${plot.height}`} width="100%" aria-hidden="true" className="block overflow-visible">
          <CartesianGrid rows={rows} x={(i) => band * (i + 0.5)} />
          {rows.map((r, i) =>
            r.values.map((v, j) =>
              v === null ? null : (
                <rect
                  key={`${i}-${j}`}
                  x={band * i + (band - group) / 2 + j * (group / series.length)}
                  y={y(v)}
                  width={bar}
                  height={Math.max(0, plot.bottom - y(v))}
                  rx={Math.min(6, bar / 4)}
                  fill={seriesColor(series[j], j)}
                  opacity={active === null || active === i ? 1 : 0.55}
                />
              ),
            ),
          )}
          <HitColumns count={rows.length} hover={hover} />
        </svg>
      )}
    </ChartFrame>
  );
}

export { BarChart };
