"use client";

import { ChartFrame, cleanRows, moveOn, useChartMotion, type ChartLabels } from "@/registry/aedis/ui/chart";
import { useFormat } from "@/registry/aedis/hooks/use-format";

type RadialChartProps = {
  /** Names the chart and its row in the data table, e.g. "Ceiling used". */
  title: string;
  /** Between 0 and max; anything else is dropped and the ring stays empty. */
  value: number;
  max: number;
  /** Under the percentage, e.g. "of $1,500". Text only. */
  caption?: string;
  format?: (value: number) => string;
  labels?: Partial<ChartLabels>;
  className?: string;
  /** Sweep the ring on enter and between values; true by default, never under reduced motion. */
  animate?: boolean;
};

const SIZE = 150;
const R = 68;
const C = 2 * Math.PI * R;

/** One value against its maximum, as a ring and a percentage. */
function RadialChart({ title, value, max, caption, format, labels, className, animate = true }: RadialChartProps) {
  const f = useFormat();
  const okMax = Number.isFinite(max) && max > 0 ? max : 0;
  const series = [{ key: "value", label: title }];
  const { rows, dropped } = cleanRows([{ label: title, value }], "label", series, 0, okMax || -1);
  const v = rows[0]?.values[0] ?? null;
  const share = v === null || !okMax ? 0 : v / okMax;
  const { ref, moves } = useChartMotion(animate, share > 0);
  return (
    <ChartFrame title={title} series={series} rows={rows} dropped={dropped} format={format} legend={false} labels={labels} className={className}>
      {() => (
        <svg ref={ref} viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} aria-hidden="true" className="mx-auto block">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--muted)" strokeWidth={14} />
          {share > 0 ? (
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--chart-1)" strokeWidth={14} strokeLinecap="round" strokeDasharray={`${share * C} ${C}`} transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`} data-enter="sweep" style={moveOn(moves, "stroke-dasharray")} />
          ) : null}
          <text x={SIZE / 2} y={SIZE / 2 + 4} textAnchor="middle" fontSize={26} fontWeight={700} fill="var(--foreground)">
            {v === null ? "—" : f.number(share, { style: "percent", maximumFractionDigits: 0 })}
          </text>
          {caption ? (
            <text x={SIZE / 2} y={SIZE / 2 + 24} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">
              {caption.slice(0, 24)}
            </text>
          ) : null}
        </svg>
      )}
    </ChartFrame>
  );
}

export { RadialChart };
