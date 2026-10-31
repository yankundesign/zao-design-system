'use client';

import { useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { ChartDataView } from './chart-data-view';
import type { ChartTable } from './chart-data-view';
import { useChartDrawing } from './use-chart-drawing';
import { crisp } from './use-chart-width';
import './charts.css';

/** Drawn in place of unknown text while a chart loads; it never holds a number. */
const drawnSummary = 'Reading the latest values for this chart.';
const drawnReadout = 'Reading values';

/**
 * Rule 3: four slots around the plot. The top row names the series and its scale;
 * the summary says what the chart shows; the bottom row holds the readout and unit.
 * While `drawing`, the known slots stay and the unknown ones are drawn (C3).
 */
export function ChartFrame({
  kind,
  series,
  scale,
  title,
  summary,
  readout,
  unit,
  announcement,
  table,
  drawing = false,
  drawingLabel = 'Loading readings',
  children,
  controls,
}: {
  kind: string;
  /** The series identifier a person or agent would query, e.g. "latency.p95". */
  series: string;
  /** Scale, sampling, or period, e.g. "30 min samples". */
  scale: string;
  title: string;
  summary: string;
  readout: string;
  unit: string;
  /** Polite selection announcements. Hover is never announced. */
  announcement: string;
  /** The chart's numbers for the data view, from the same data as its marks. */
  table?: ChartTable;
  /** Structure only, no marks and no numbers, while the host loads data. */
  drawing?: boolean;
  /** Announced politely once while drawing. */
  drawingLabel?: string;
  children: ReactNode;
  controls?: ReactNode;
}) {
  const titleId = useId();
  const summaryId = useId();
  const root = useRef<HTMLElement>(null);
  const building = useChartDrawing(drawing, root);

  return (
    <figure
      ref={root}
      data-zao-chart={kind}
      data-zao-drawing={drawing ? '' : undefined}
      data-zao-building={building ? '' : undefined}
      aria-busy={drawing || undefined}
      aria-labelledby={titleId}
      aria-describedby={drawing ? undefined : summaryId}
      className="chart-frame flex min-w-0 flex-col gap-3"
    >
      <div
        data-zao-slot="chart-head"
        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono type-caption text-muted"
      >
        <span data-zao-slot="chart-series">{series}</span>
        <span data-zao-slot="chart-scale">{scale}</span>
      </div>

      {children}

      <figcaption className="flex flex-col gap-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span id={titleId} className="type-label font-medium">
            {title}
          </span>
          <span className="type-caption text-muted">Illustrative data</span>
        </span>
        <span
          id={summaryId}
          data-zao-slot="chart-summary"
          className={`type-body text-muted${drawing ? ' construction-drawing' : ''}`}
        >
          <span aria-hidden={drawing || undefined}>{drawing ? drawnSummary : summary}</span>
        </span>
      </figcaption>

      <div
        data-zao-slot="chart-foot"
        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-subtle pt-2 font-mono type-caption figures-tabular"
      >
        <span
          data-zao-slot="chart-readout"
          className={drawing ? 'construction-drawing' : undefined}
        >
          <span aria-hidden={drawing || undefined}>{drawing ? drawnReadout : readout}</span>
        </span>
        <span data-zao-slot="chart-unit" className="text-muted">
          {unit}
        </span>
      </div>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {drawing ? drawingLabel : announcement}
      </span>
      {table && <ChartDataView title={title} table={table} disabled={drawing} />}
      {controls && <div inert={drawing || undefined}>{controls}</div>}
    </figure>
  );
}

/**
 * Rule 2's dash, fitted to its line: the 2px dash stays and the gap stretches near 3px, so
 * whole dashes start and end every reference instead of stopping wherever the plot ends.
 */
export function fittedDash(length: number, dash = 2, gap = 3) {
  if (length < dash * 2 + gap / 2) return `${dash} ${gap}`;
  const count = Math.max(2, Math.round((length + gap) / (dash + gap)));
  return `${dash} ${((length - count * dash) / (count - 1)).toFixed(3)}`;
}

/** The length of a polyline drawn from `M`/`L` commands, for fitting its dashes. */
export function polylineLength(points: readonly { x: number; y: number }[]) {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += Math.hypot(
      points[index]!.x - points[index - 1]!.x,
      points[index]!.y - points[index - 1]!.y,
    );
  }
  return length;
}

/** Rule 2: a solid baseline with end stops and graduations, like the Tabs ruler. */
export function Ruler({
  x0,
  x1,
  y,
  ticks = [],
}: {
  x0: number;
  x1: number;
  y: number;
  ticks?: { x: number; major?: boolean }[];
}) {
  const line = crisp(y);
  const start = crisp(x0);
  const end = crisp(x1);
  return (
    <g
      data-zao-slot="chart-ruler"
      className="chart-structure"
      stroke="var(--zao-color-border-default)"
    >
      <line x1={start} y1={line} x2={end} y2={line} />
      <line x1={start} y1={line - 4} x2={start} y2={line + 4} />
      <line x1={end} y1={line - 4} x2={end} y2={line + 4} />
      {ticks.map((tick) => (
        <line
          key={tick.x}
          x1={crisp(tick.x)}
          y1={line}
          x2={crisp(tick.x)}
          y2={line + (tick.major ? 6 : 3)}
        />
      ))}
    </g>
  );
}

/** Mono axis and value labels inside the SVG, at the caption role's size. */
export function ChartLabel({
  x,
  y,
  anchor = 'middle',
  strong = false,
  children,
}: {
  x: number;
  y: number;
  anchor?: 'start' | 'middle' | 'end';
  strong?: boolean;
  children: ReactNode;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      className={`chart-label font-mono type-caption figures-tabular ${strong ? 'is-strong' : ''}`}
      fill={strong ? 'var(--zao-color-fg-default)' : 'var(--zao-color-fg-muted)'}
    >
      {children}
    </text>
  );
}

/** Rule 4: one accent square, in ink. Data never carries the seal (finish plan V1). */
export function AccentSquare({ x, y, size = 6 }: { x: number; y: number; size?: number }) {
  return (
    <rect
      data-zao-slot="chart-accent"
      className="chart-accent"
      x={Math.round(x - size / 2)}
      y={Math.round(y - size / 2)}
      width={size}
      height={size}
      fill="var(--zao-color-fg-default)"
    />
  );
}
