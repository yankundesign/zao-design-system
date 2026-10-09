'use client';

import { useId } from 'react';
import type { ReactNode } from 'react';
import { crisp } from './use-chart-width';
import './charts.css';

/**
 * Rule 3: four slots around the plot. The top row names the series and its scale;
 * the summary says what the chart shows; the bottom row holds the readout and unit.
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
  children: ReactNode;
  controls?: ReactNode;
}) {
  const titleId = useId();
  const summaryId = useId();

  return (
    <figure
      data-zao-chart={kind}
      aria-labelledby={titleId}
      aria-describedby={summaryId}
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
        <span id={summaryId} data-zao-slot="chart-summary" className="type-body text-muted">
          {summary}
        </span>
      </figcaption>

      <div
        data-zao-slot="chart-foot"
        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-subtle pt-2 font-mono type-caption figures-tabular"
      >
        <span data-zao-slot="chart-readout">{readout}</span>
        <span data-zao-slot="chart-unit" className="text-muted">
          {unit}
        </span>
      </div>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
      {controls}
    </figure>
  );
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

/** Rule 4: one accent square. */
export function AccentSquare({ x, y, size = 6 }: { x: number; y: number; size?: number }) {
  return (
    <rect
      data-zao-slot="chart-accent"
      className="chart-accent"
      x={Math.round(x - size / 2)}
      y={Math.round(y - size / 2)}
      width={size}
      height={size}
      fill="var(--zao-color-accent-solid)"
    />
  );
}
