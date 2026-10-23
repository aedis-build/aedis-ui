"use client";

import { CartesianGrid, ChartFrame, cleanRows, HitColumns, lineScale, linePath, lineX, moveOn, plot, seriesColor, useChartMotion, XTicks, type CartesianChartProps } from "@/registry/aedis/ui/chart";

/** One line per series, with a dot on each value. */
function LineChart({ title, data, index, series, indexLabel, format, legend = series.length > 1, labels, className, animate = true }: CartesianChartProps) {
  const { rows, dropped } = cleanRows(data, index, series);
  const { ref, moves } = useChartMotion(animate, rows.length);
  const y = lineScale(rows);
  const x = (i: number) => lineX(i, rows.length);
  return (
    <ChartFrame title={title} series={series} rows={rows} dropped={dropped} indexLabel={indexLabel} format={format} legend={legend} labels={labels} className={className}>
      {({ active, hover }) => (
        <>
          <svg ref={ref} viewBox={`0 0 ${plot.width} ${plot.height}`} width="100%" aria-hidden="true" className="block overflow-visible">
            <CartesianGrid />
            {series.map((s, j) => (
              <g key={s.key} stroke={seriesColor(s, j)}>
                <path d={linePath(rows.map((r, i) => (r.values[j] === null ? null : [x(i), y(r.values[j]!)])))} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} data-enter="draw" style={moveOn(moves, "d")} />
                {rows.map((r, i) => (r.values[j] === null ? null : <circle key={i} cx={x(i)} cy={y(r.values[j]!)} r={active === i ? 4.5 : 3} fill="var(--surface)" strokeWidth={2} data-enter="fade" data-order={i} style={moveOn(moves, "cx cy")} />))}
              </g>
            ))}
            <HitColumns count={rows.length} hover={hover} />
          </svg>
          <XTicks rows={rows} x={x} />
        </>
      )}
    </ChartFrame>
  );
}

export { LineChart };
