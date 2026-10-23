"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useFormat } from "@/registry/aedis/hooks/use-format";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";

export type ChartLabels = Messages["chart"];

/** A series is a key of each row, shown under `label`. Colors are theme tokens only, so they keep 3:1 in every theme. */
export type ChartSeries = { key: string; label: string; color?: 1 | 2 | 3 | 4 | 5 };

/** One row of data, as it came from the backend: nothing in it is trusted to be a number or plain text. */
export type ChartRow = Record<string, unknown>;

/** A row after checking: its label as text and one value per series, or null where the value was dropped. */
export type CleanRow = { label: string; values: (number | null)[] };

export const seriesColor = (s: ChartSeries, i: number) => `var(--chart-${s.color ?? (i % 5) + 1})`;

/** Rows and points beyond these are dropped, so a huge payload cannot freeze the page. */
export const MAX_ROWS = 500;
export const MAX_LABEL = 64;

/**
 * Keeps finite numbers within [min, max] and drops (and counts) everything else: NaN, Infinity, strings, values out of
 * range. Labels become strings, cut to MAX_LABEL. A dropped value is never drawn, so nothing lands off the canvas.
 */
export function cleanRows(rows: readonly ChartRow[], index: string, series: readonly ChartSeries[], min = 0, max = Number.MAX_SAFE_INTEGER) {
  let dropped = Math.max(0, rows.length - MAX_ROWS) * series.length;
  const clean: CleanRow[] = rows.slice(0, MAX_ROWS).map((row) => ({
    label: String(row[index] ?? "").slice(0, MAX_LABEL),
    values: series.map((s) => {
      const v = row[s.key];
      if (typeof v === "number" && Number.isFinite(v) && v >= min && v <= max) return v;
      dropped++;
      return null;
    }),
  }));
  return { rows: clean, dropped };
}

/** The top of the value axis: the largest value rounded up to 1, 2, 2.5 or 5 times a power of ten. */
export function niceMax(value: number) {
  if (!(value > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(value));
  return ([1, 2, 2.5, 5, 10].find((m) => m * p >= value) ?? 10) * p;
}

/** A tick label short enough for its slot; the full label stays in the tooltip and the table. */
export const tick = (label: string, max = 10) => (label.length > max ? `${label.slice(0, max - 1)}…` : label);

type ChartFrameProps = {
  /** Names the chart for assistive technology and captions its data table. */
  title: string;
  series: readonly ChartSeries[];
  rows: CleanRow[];
  dropped: number;
  /** Header of the first column of the data table, e.g. "Day". */
  indexLabel?: string;
  format?: (value: number) => string;
  legend?: boolean;
  labels?: Partial<ChartLabels>;
  className?: string;
  /** The drawing. `active` is the row under the pointer or the keyboard; `hover` sets it. */
  children: (state: { active: number | null; hover: (i: number | null) => void }) => React.ReactNode;
};

/**
 * What every chart shares: a focusable plot (arrow keys move through the rows, Escape hides the tooltip), a tooltip
 * and legend in text, a data table for screen readers, and a note when values were dropped.
 */
function ChartFrame({ title, series, rows, dropped, indexLabel, format, legend = true, labels, className, children }: ChartFrameProps) {
  const l = useMessages("chart", labels);
  const f = useFormat();
  const fmt = format ?? ((n: number) => f.number(n));
  const [active, setActive] = React.useState<number | null>(null);

  function onKeyDown(e: React.KeyboardEvent) {
    const last = rows.length - 1;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? Math.min(last, (active ?? -1) + 1)
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? Math.max(0, (active ?? rows.length) - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : e.key === "Escape" ? null
      : undefined;
    if (next === undefined || last < 0) return;
    e.preventDefault();
    setActive(next);
  }

  const row = active === null ? null : rows[active];
  return (
    <figure data-slot="chart" className={cn("relative m-0 flex flex-col gap-3", className)}>
      <div
        role="group"
        aria-label={title}
        aria-roledescription={l.chart}
        tabIndex={rows.length ? 0 : -1}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
        className="focus-ring relative rounded-md"
      >
        {children({ active, hover: setActive })}
        {row ? (
          <div
            data-slot="chart-tooltip"
            aria-live="polite"
            className="pointer-events-none absolute top-1 z-10 flex min-w-28 -translate-x-1/2 flex-col gap-0.5 rounded-md border border-hairline bg-surface-raised px-2.5 py-2 text-caption shadow-elevation-2"
            style={{ left: `${Math.min(85, Math.max(15, ((active! + 0.5) / rows.length) * 100))}%` }}
          >
            <span className="font-semibold">{row.label}</span>
            {series.map((s, i) => (
              <span key={s.key} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: seriesColor(s, i) }} />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="ml-auto pl-2 font-medium tabular-nums">{row.values[i] === null ? "—" : fmt(row.values[i]!)}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {legend ? <ChartLegend series={series} /> : null}
      {dropped > 0 ? <p className="text-caption text-muted-foreground">{l.notShown.replace("{count}", fmt(dropped))}</p> : null}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{indexLabel ?? l.item}</th>
            {series.map((s) => <th key={s.key} scope="col">{s.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <th scope="row">{r.label}</th>
              {r.values.map((v, j) => <td key={j}>{v === null ? "—" : fmt(v)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Series names with their color, as text. */
function ChartLegend({ series, className }: { series: readonly ChartSeries[]; className?: string }) {
  return (
    <ul data-slot="chart-legend" aria-hidden="true" className={cn("m-0 flex list-none flex-wrap gap-x-3.5 gap-y-1 p-0 text-caption text-muted-foreground", className)}>
      {series.map((s, i) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full" style={{ background: seriesColor(s, i) }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

/** Props every cartesian chart takes. */
export type CartesianChartProps = {
  title: string;
  /** Rows, e.g. [{ day: "Mon", support: 120 }]. Values that are not finite numbers ≥ 0 are dropped and counted. */
  data: readonly ChartRow[];
  /** The key of each row that names it: the x axis. */
  index: string;
  series: readonly ChartSeries[];
  indexLabel?: string;
  format?: (value: number) => string;
  legend?: boolean;
  labels?: Partial<ChartLabels>;
  className?: string;
};

/** The drawing area shared by area, bar and line charts, in viewBox units. */
export const plot = { width: 520, height: 172, top: 8, bottom: 168 };

/** "M x y L x y …" through the points, starting a new segment after each dropped value instead of bridging it. */
export function linePath(points: (readonly [number, number] | null)[]) {
  let d = "";
  let open = false;
  for (const p of points) {
    if (!p) open = false;
    else {
      d += `${open ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
      open = true;
    }
  }
  return d;
}

/** x of row i: the first row on the left edge, the last on the right. */
export const lineX = (i: number, count: number) => (count < 2 ? plot.width / 2 : (i / (count - 1)) * plot.width);

export function lineScale(rows: CleanRow[], stacked = false) {
  const totals = rows.map((r) => (stacked ? r.values.reduce<number>((a, v) => a + (v ?? 0), 0) : Math.max(0, ...r.values.map((v) => v ?? 0))));
  const top = niceMax(Math.max(0, ...totals));
  return (v: number) => plot.bottom - (v / top) * (plot.bottom - plot.top);
}

/** Horizontal grid lines behind the marks. */
function CartesianGrid() {
  return (
    <g aria-hidden="true">
      {[0, 1, 2, 3].map((k) => {
        const y = plot.top + ((plot.bottom - plot.top) * k) / 3;
        return <line key={k} x1={0} x2={plot.width} y1={y} y2={y} stroke="var(--hairline)" />;
      })}
    </g>
  );
}

/** The x labels as HTML text under the drawing, so they keep their size however narrow the chart gets. */
function XTicks({ rows, x }: { rows: CleanRow[]; x: (i: number) => number }) {
  return (
    <div data-slot="chart-ticks" aria-hidden="true" className="relative h-4 text-caption text-muted-foreground">
      {rows.map((r, i) => {
        const left = (x(i) / plot.width) * 100;
        return (
          <span key={i} className="absolute top-0 whitespace-nowrap" style={{ left: `${left}%`, transform: `translateX(${left <= 0 ? 0 : left >= 100 ? -100 : -50}%)` }}>
            {tick(r.label, Math.max(3, Math.floor(64 / rows.length)))}
          </span>
        );
      })}
    </div>
  );
}

/** One transparent column per row that sets the active row under the pointer. */
function HitColumns({ count, hover }: { count: number; hover: (i: number | null) => void }) {
  const w = plot.width / Math.max(1, count);
  return (
    <g aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <rect key={i} x={i * w} y={0} width={w} height={plot.height} fill="transparent" onPointerEnter={() => hover(i)} />
      ))}
    </g>
  );
}

export { CartesianGrid, ChartFrame, ChartLegend, HitColumns, XTicks };
