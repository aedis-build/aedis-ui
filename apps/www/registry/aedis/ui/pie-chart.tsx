"use client";

import { ChartFrame, cleanRows, moveOn, seriesColor, useChartMotion, type ChartLabels, type ChartRow } from "@/registry/aedis/ui/chart";

type PieChartProps = {
  title: string;
  /** One row per slice, e.g. [{ model: "Large", spend: 640 }]. Values that are not finite numbers ≥ 0 are dropped. */
  data: readonly ChartRow[];
  /** The key that names each slice. */
  index: string;
  /** The key that holds each slice's value, and its name in the tooltip and table. */
  value: { key: string; label: string };
  /** Text in the hole of the donut, e.g. the total. Text only. */
  center?: string;
  format?: (value: number) => string;
  labels?: Partial<ChartLabels>;
  className?: string;
  /** Sweep the arcs on enter and between values; true by default, never under reduced motion. */
  animate?: boolean;
};

const SIZE = 150;
const R = 64;
const C = 2 * Math.PI * R;

/** A donut: one ring segment per row, colored in order, with the legend naming the rows. */
function PieChart({ title, data, index, value, center, format, labels, className, animate = true }: PieChartProps) {
  const series = [value];
  const { rows, dropped } = cleanRows(data, index, series);
  const { ref, moves } = useChartMotion(animate, rows.length);
  const total = rows.reduce((a, r) => a + (r.values[0] ?? 0), 0);
  // The legend names slices, not the one value series: give each row its own color.
  const slices = rows.map((r, i) => ({ key: String(i), label: r.label }));
  return (
    <ChartFrame title={title} series={series} rows={rows} dropped={dropped} format={format} legend={false} labels={labels} className={className}>
      {({ active, hover }) => {
        // Inside the render: it runs again on every hover, and each run must start the ring from the top.
        let start = 0;
        return (
          <div className="flex flex-col items-center gap-3">
            <svg ref={ref} viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} aria-hidden="true" className="block">
              <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--muted)" strokeWidth={22} />
              {total > 0
                ? rows.map((r, i) => {
                    const len = ((r.values[0] ?? 0) / total) * C;
                    const offset = start;
                    start += len;
                    return len > 0 ? (
                      <circle
                        key={i}
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={R}
                        fill="none"
                        stroke={seriesColor(slices[i], i)}
                        strokeWidth={active === i ? 26 : 22}
                        strokeDasharray={`${Math.max(0, len - 2)} ${C}`}
                        strokeDashoffset={-offset}
                        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                        onPointerEnter={() => hover(i)}
                        data-enter="sweep"
                        data-order={i}
                        style={moveOn(moves, "stroke-dasharray stroke-dashoffset stroke-width")}
                      />
                    ) : null;
                  })
                : null}
              {center ? (
                <text x={SIZE / 2} y={SIZE / 2 + 7} textAnchor="middle" fontSize={20} fontWeight={700} fill="var(--foreground)">
                  {center.slice(0, 12)}
                </text>
              ) : null}
            </svg>
            <ul aria-hidden="true" className="m-0 flex list-none flex-wrap justify-center gap-x-3 gap-y-1 p-0 text-caption text-muted-foreground">
              {slices.map((s, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: seriesColor(s, i) }} />
                  {s.label}
                </li>
              ))}
            </ul>
          </div>
        );
      }}
    </ChartFrame>
  );
}

export { PieChart };
