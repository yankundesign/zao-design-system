'use client';

import { useState } from 'react';
import { AccentSquare, ChartFrame, ChartLabel, Ruler, fittedDash } from './chart-frame';
import { ChartInspector, useInspection } from './chart-inspector';
import {
  formatMinutes,
  initialSessions,
  lastWeekSessions,
  sessionBinMinutes,
  sessionBins,
  stepSessions,
} from './data';
import { crisp, useChartWidth } from './use-chart-width';
import { LiveSimulationSwitch, useLiveSimulation } from './use-live-simulation';

const count = new Intl.NumberFormat('en-US');
/** Combs tighter than this shimmer; merge bins instead. */
const minimumPitch = 3;
/** Geist Mono's advance at the caption role's 12px, for keeping reference labels apart. */
const captionAdvance = 7.4;
/** The two reference label rows above the comb, one caption line apart (wave 2, H1). */
const labelRows: readonly [number, number] = [12, 28];

function binLabel(minutes: number) {
  return minutes < 1 ? `${minutes * 60} s` : `${minutes} min`;
}

/** Bins merged by 1, 2 or 4 so the comb keeps at least 3px between strokes. */
function mergeFactor(plotWidth: number) {
  return [1, 2, 4].find((merge) => plotWidth / (sessionBins / merge) >= minimumPitch) ?? 4;
}

function merge(bins: readonly number[], factor: number) {
  return Array.from({ length: bins.length / factor }, (_, index) =>
    bins.slice(index * factor, index * factor + factor).reduce((sum, value) => sum + value, 0),
  );
}

/** The first bin whose running count reaches the share: its upper edge bounds the share. */
function percentileBin(bins: readonly number[], share: number) {
  const total = bins.reduce((sum, value) => sum + value, 0);
  let running = 0;
  for (let index = 0; index < bins.length; index += 1) {
    running += bins[index]!;
    if (running >= total * share) return index;
  }
  return bins.length - 1;
}

function minuteTicks(left: number, plotWidth: number) {
  return [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map((minute) => ({
    x: left + (minute / 60) * plotWidth,
    major: minute % 15 === 0,
  }));
}

function MinuteLabels({ ticks, y }: { ticks: { x: number; major?: boolean }[]; y: number }) {
  return ticks
    .filter((tick) => tick.major)
    .map((tick, index, majors) => (
      <ChartLabel
        key={tick.x}
        x={tick.x}
        y={y}
        anchor={index === 0 ? 'start' : index === majors.length - 1 ? 'end' : 'middle'}
      >
        {index === majors.length - 1 ? '60 min' : index * 15}
      </ChartLabel>
    ));
}

interface Reference {
  name: string;
  x: number;
  minutes: number;
}

/**
 * H1: labels share the first row; only where two would touch does the later step into the
 * second. A label sits right of its line, or left of it near the plot's end, and never
 * crosses another reference's line: a line rises to its own label's row, so a first-row
 * label may pass over a line whose label sits in the second row, never the reverse. If the
 * labels can't all fit with their unit they drop it; one that still can't fit is left to
 * the summary, and its line stops at the second row.
 */
function placeReferences(references: readonly Reference[], left: number, right: number) {
  const attempt = (unit: boolean) => {
    const placed: {
      reference: Reference;
      row: 0 | 1;
      from: number;
      width: number;
      anchor: 'start' | 'end';
      text: string;
    }[] = [];
    const secondRowOnly = new Set<string>();
    let complete = true;
    for (const reference of references) {
      const text = `${reference.name} ${formatMinutes(reference.minutes)}${unit ? ' min' : ''}`;
      const width = text.length * captionAdvance;
      const others = references.filter((other) => other !== reference);
      const candidates = [
        { row: 0 as const, anchor: 'start' as const, from: reference.x + 6 },
        { row: 1 as const, anchor: 'start' as const, from: reference.x + 6 },
        { row: 0 as const, anchor: 'end' as const, from: reference.x - 6 - width },
        { row: 1 as const, anchor: 'end' as const, from: reference.x - 6 - width },
      ];
      const spans = (from: number, lineX: number) => lineX >= from - 3 && lineX <= from + width + 3;
      const fit = candidates.find((candidate) => {
        if (candidate.row === 0 && secondRowOnly.has(reference.name)) return false;
        if (candidate.from < left || candidate.from + width > right) return false;
        if (candidate.row === 1 && others.some((other) => spans(candidate.from, other.x))) {
          return false;
        }
        return !placed.some(
          (other) =>
            (candidate.row === 0 && other.row === 0 && spans(candidate.from, other.reference.x)) ||
            (other.row === candidate.row &&
              candidate.from < other.from + other.width + 8 &&
              other.from < candidate.from + width + 8),
        );
      });
      if (!fit) {
        complete = false;
        continue;
      }
      if (fit.row === 0) {
        others
          .filter((other) => spans(fit.from, other.x))
          .forEach((other) => secondRowOnly.add(other.name));
      }
      placed.push({ reference, row: fit.row, from: fit.from, width, anchor: fit.anchor, text });
    }
    return { placed, complete };
  };
  const withUnit = attempt(true);
  const { placed } = withUnit.complete ? withUnit : attempt(false);
  return placed.map((label) => ({
    ...label,
    x: label.anchor === 'start' ? label.from : label.from + label.width,
  }));
}

/** A comb of hairlines, one per bin: the instrument's ring, unrolled. */
export function HistogramChart({
  compact = false,
  drawing = false,
}: {
  compact?: boolean;
  drawing?: boolean;
}) {
  const [plotRef, width] = useChartWidth<HTMLDivElement>();
  const [series, setSeries] = useState(initialSessions);
  const simulation = useLiveSimulation(() => setSeries((current) => stepSessions(current)));

  const left = 8;
  const right = width - 8;
  const plotWidth = right - left;
  const factor = mergeFactor(plotWidth);
  const binCount = sessionBins / factor;
  const binMinutes = sessionBinMinutes * factor;
  const bins = merge(series.bins, factor);
  const latest = Math.floor(series.latest / factor);
  const inspection = useInspection(binCount);

  const height = (compact ? 176 : 216) + 16;
  const top = 40;
  const baseline = height - 34;
  const pitch = plotWidth / binCount;
  const x = (index: number) => left + pitch * (index + 0.5);
  const peak = Math.max(...bins);
  const scaleMax = Math.ceil((peak * 1.15) / 25) * 25;
  const y = (value: number) => baseline - (value / scaleMax) * (baseline - top);
  const active = inspection.active;

  const total = bins.reduce((sum, value) => sum + value, 0);
  const mode = bins.indexOf(peak);
  const edge = (index: number) => left + ((index + 1) / binCount) * plotWidth;
  const references: Reference[] = (
    [
      ['p50', 0.5],
      ['p95', 0.95],
      ['p99', 0.99],
    ] as const
  ).map(([name, share]) => {
    const index = percentileBin(bins, share);
    return { name, x: crisp(edge(index)), minutes: (index + 1) * binMinutes };
  });
  const [p50, p95, p99] = references.map((reference) => formatMinutes(reference.minutes));
  const labels = placeReferences(references, left, right);
  const range = (index: number) =>
    `${formatMinutes(index * binMinutes)}–${formatMinutes((index + 1) * binMinutes)} min`;
  const summary = `Half of sessions end within ${p50} minutes, 95% within ${p95} and 99% within ${p99}. The most common length is ${range(mode)}.`;
  const readout =
    active === null
      ? `${count.format(total)} sessions · p50 ${p50} min`
      : `${range(active)} · ${count.format(bins[active]!)} sessions${active === latest ? ' · latest' : ''}`;
  const ticks = minuteTicks(left, plotWidth);
  const data = bins.map((value, index) => ({
    x: left + pitch * index,
    y: 0,
    width: pitch,
    height,
    label: `${range(index)}: ${count.format(value)} sessions${index === latest ? ', latest' : ''}`,
  }));
  const table = {
    columns: [{ label: 'Session length' }, { label: 'Sessions', numeric: true }],
    rows: bins.map((value, index) => [range(index), count.format(value)]),
  };

  return (
    <ChartFrame
      kind="histogram"
      series="session.length"
      scale={`${binLabel(binMinutes)} bins`}
      title="Session length"
      summary={summary}
      readout={readout}
      unit="sessions"
      announcement={inspection.announcement}
      table={compact ? undefined : table}
      drawing={drawing}
      drawingLabel="Loading session lengths"
      controls={
        compact ? undefined : (
          <LiveSimulationSwitch
            running={simulation.running}
            onRunningChange={simulation.setRunning}
          />
        )
      }
    >
      <div ref={plotRef} className="chart-plot" style={{ height }}>
        <svg width={width} height={height} aria-hidden="true" focusable="false">
          {!drawing && (
            <>
              {references.map((reference) => {
                const label = labels.find((placed) => placed.reference === reference);
                const y1 = labelRows[label?.row ?? 1] - 8;
                return (
                  <line
                    key={reference.name}
                    data-zao-slot="chart-reference"
                    data-percentile={reference.name}
                    data-chart-ink="muted"
                    x1={reference.x}
                    x2={reference.x}
                    y1={y1}
                    y2={crisp(baseline)}
                    stroke="var(--zao-color-fg-muted)"
                    strokeWidth="1"
                    strokeDasharray={fittedDash(crisp(baseline) - y1)}
                  />
                );
              })}
              {labels.map((label) => (
                <g
                  key={label.reference.name}
                  data-zao-slot="chart-reference-label"
                  data-percentile={label.reference.name}
                >
                  <ChartLabel x={label.x} y={labelRows[label.row]} anchor={label.anchor}>
                    {label.text}
                  </ChartLabel>
                </g>
              ))}
              {bins.map((value, index) =>
                value === 0 ? null : (
                  <line
                    key={index}
                    data-zao-slot="chart-mark"
                    data-chart-ink={active === null || active === index ? 'data' : 'muted'}
                    x1={crisp(x(index))}
                    x2={crisp(x(index))}
                    y1={crisp(baseline)}
                    y2={y(value)}
                    stroke={
                      active === null || active === index
                        ? 'var(--zao-color-fg-default)'
                        : 'var(--zao-color-fg-muted)'
                    }
                    strokeWidth="1"
                  />
                ),
              )}
            </>
          )}
          <Ruler x0={left} x1={right} y={baseline} ticks={ticks} />
          {!drawing && (
            <>
              <MinuteLabels ticks={ticks} y={baseline + 22} />
              {active !== null && (
                <rect
                  data-zao-slot="chart-guide"
                  data-chart-fill
                  x={Math.round(x(active) - 2.5)}
                  y={Math.round(y(bins[active]!) - 2.5)}
                  width="5"
                  height="5"
                  fill="var(--zao-color-fg-default)"
                />
              )}
              <AccentSquare x={x(latest)} y={y(bins[latest]!)} />
            </>
          )}
        </svg>
        {!drawing && (
          <ChartInspector
            inspection={inspection}
            data={data}
            width={width}
            height={height}
            name="session length bins"
          />
        )}
      </div>
    </ChartFrame>
  );
}

/**
 * Two periods on one ruler (H2): this week rises above it and last week hangs below, with the
 * same bins and the same scale, so equal counts are equal lengths.
 */
export function MirroredHistogram({ drawing = false }: { drawing?: boolean }) {
  const [plotRef, width] = useChartWidth<HTMLDivElement>();
  const [series, setSeries] = useState(initialSessions);
  const [lastWeek] = useState(lastWeekSessions);
  const simulation = useLiveSimulation(() => setSeries((current) => stepSessions(current)));

  const left = 8;
  const right = width - 8;
  const plotWidth = right - left;
  const factor = mergeFactor(plotWidth);
  const binCount = sessionBins / factor;
  const binMinutes = sessionBinMinutes * factor;
  const thisBins = merge(series.bins, factor);
  const lastBins = merge(lastWeek, factor);
  const latest = Math.floor(series.latest / factor);
  const inspection = useInspection(binCount);

  const upperRow = 12;
  const top = 20;
  const half = 72;
  const middle = top + half;
  const bottom = middle + half;
  const lowerRow = bottom + 16;
  const height = bottom + 42;
  const pitch = plotWidth / binCount;
  const x = (index: number) => left + pitch * (index + 0.5);
  const scaleMax = Math.ceil((Math.max(...thisBins, ...lastBins) * 1.15) / 25) * 25;
  const length = (value: number) => (value / scaleMax) * half;
  const active = inspection.active;

  const thisTotal = thisBins.reduce((sum, value) => sum + value, 0);
  const lastTotal = lastBins.reduce((sum, value) => sum + value, 0);
  const thisMedian = (percentileBin(thisBins, 0.5) + 1) * binMinutes;
  const lastMedian = (percentileBin(lastBins, 0.5) + 1) * binMinutes;
  const difference = thisMedian - lastMedian;
  const minutes = (value: number) => `${formatMinutes(value)} minute${value === 1 ? '' : 's'}`;
  const summary = `Half of sessions end within ${formatMinutes(thisMedian)} minutes this week, ${
    difference === 0
      ? 'the same as last week'
      : `${minutes(Math.abs(difference))} ${difference > 0 ? 'longer' : 'shorter'} than last week`
  }.`;
  const range = (index: number) =>
    `${formatMinutes(index * binMinutes)}–${formatMinutes((index + 1) * binMinutes)} min`;
  const readout =
    active === null
      ? `${count.format(thisTotal)} this week · ${count.format(lastTotal)} last week`
      : `${range(active)} · ${count.format(thisBins[active]!)} this week · ${count.format(lastBins[active]!)} last week`;
  const ticks = minuteTicks(left, plotWidth);
  const data = thisBins.map((value, index) => ({
    x: left + pitch * index,
    y: 0,
    width: pitch,
    height,
    label: `${range(index)}: ${count.format(value)} sessions this week, ${count.format(lastBins[index]!)} last week`,
  }));
  const table = {
    columns: [
      { label: 'Session length' },
      { label: 'This week', numeric: true },
      { label: 'Last week', numeric: true },
    ],
    rows: thisBins.map((value, index) => [
      range(index),
      count.format(value),
      count.format(lastBins[index]!),
    ]),
  };
  const edge = (median: number) => crisp(left + (median / 60) * plotWidth);
  const thisX = edge(thisMedian);
  const lastX = edge(lastMedian);
  const m = crisp(middle);

  return (
    <ChartFrame
      kind="histogram-compare"
      series="session.length"
      scale={`${binLabel(binMinutes)} bins · this week vs last`}
      title="Session length, this week and last"
      summary={summary}
      readout={readout}
      unit="sessions"
      announcement={inspection.announcement}
      table={table}
      drawing={drawing}
      drawingLabel="Loading session lengths"
      controls={
        <LiveSimulationSwitch
          running={simulation.running}
          onRunningChange={simulation.setRunning}
        />
      }
    >
      <div ref={plotRef} className="chart-plot" style={{ height }}>
        <svg width={width} height={height} aria-hidden="true" focusable="false">
          {!drawing && (
            <>
              <line
                data-zao-slot="chart-reference"
                data-percentile="p50"
                data-period="this"
                data-chart-ink="muted"
                x1={thisX}
                x2={thisX}
                y1={upperRow - 8}
                y2={m}
                stroke="var(--zao-color-fg-muted)"
                strokeWidth="1"
                strokeDasharray={fittedDash(m - (upperRow - 8))}
              />
              <ChartLabel x={thisX + 6} y={upperRow} anchor="start">
                p50 {formatMinutes(thisMedian)}
              </ChartLabel>
              <line
                data-zao-slot="chart-reference"
                data-percentile="p50"
                data-period="last"
                data-chart-ink="muted"
                x1={lastX}
                x2={lastX}
                y1={m}
                y2={lowerRow + 4}
                stroke="var(--zao-color-fg-muted)"
                strokeWidth="1"
                strokeDasharray={fittedDash(lowerRow + 4 - m)}
              />
              <ChartLabel x={lastX + 6} y={lowerRow} anchor="start">
                p50 {formatMinutes(lastMedian)}
              </ChartLabel>
              <ChartLabel x={right} y={upperRow} anchor="end">
                this week
              </ChartLabel>
              <ChartLabel x={right} y={lowerRow} anchor="end">
                last week
              </ChartLabel>
              {thisBins.map((value, index) =>
                value === 0 ? null : (
                  <line
                    key={`this-${index}`}
                    data-zao-slot="chart-mark"
                    data-period="this"
                    data-bin={index}
                    data-chart-ink={active === null || active === index ? 'data' : 'muted'}
                    x1={crisp(x(index))}
                    x2={crisp(x(index))}
                    y1={m}
                    y2={middle - length(value)}
                    stroke={
                      active === null || active === index
                        ? 'var(--zao-color-fg-default)'
                        : 'var(--zao-color-fg-muted)'
                    }
                    strokeWidth="1"
                  />
                ),
              )}
              {lastBins.map((value, index) =>
                value === 0 ? null : (
                  <line
                    key={`last-${index}`}
                    data-zao-slot="chart-mark"
                    data-period="last"
                    data-bin={index}
                    data-chart-ink={active === index ? 'data' : 'muted'}
                    x1={crisp(x(index))}
                    x2={crisp(x(index))}
                    y1={m}
                    y2={middle + 1 + length(value)}
                    stroke={
                      active === index ? 'var(--zao-color-fg-default)' : 'var(--zao-color-fg-muted)'
                    }
                    strokeWidth="1"
                  />
                ),
              )}
            </>
          )}
          <Ruler x0={left} x1={right} y={middle} ticks={ticks} />
          {!drawing && (
            <>
              <MinuteLabels ticks={ticks} y={height - 8} />
              <AccentSquare x={x(latest)} y={middle - length(thisBins[latest]!)} />
            </>
          )}
        </svg>
        {!drawing && (
          <ChartInspector
            inspection={inspection}
            data={data}
            width={width}
            height={height}
            name="session length bins, this week and last"
          />
        )}
      </div>
    </ChartFrame>
  );
}
