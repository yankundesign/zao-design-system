'use client';

import { useState } from 'react';
import {
  AccentSquare,
  ChartFrame,
  ChartLabel,
  Ruler,
  fittedDash,
  polylineLength,
} from './chart-frame';
import { ChartInspector, useInspection } from './chart-inspector';
import {
  forecastLatency,
  forecastSamples,
  formatMinutes,
  initialLatency,
  latencySamples,
  latencyScaleMax,
  stepLatency,
} from './data';
import type { LatencyEvent, LatencySeries } from './data';
import { crisp, useChartWidth } from './use-chart-width';
import { LiveSimulationSwitch, useLiveSimulation } from './use-live-simulation';

const spoken = ['No', 'One', 'Two', 'Three', 'Four', 'Five'];
/** Geist Mono's advance at the caption role's 12px, for keeping lane labels apart. */
const captionAdvance = 7.4;
/** The event lane below the time labels (wave 2, E1). */
const eventLane = 16;

function ago(hours: number) {
  if (hours === 0) return 'just now';
  if (hours < 1) return `${hours * 60} minutes ago`;
  return `${formatMinutes(hours)} hour${hours === 1 ? '' : 's'} ago`;
}

function mean(values: readonly (number | null | undefined)[]) {
  const known = values.filter((value): value is number => typeof value === 'number');
  return known.length ? known.reduce((sum, value) => sum + value, 0) / known.length : null;
}

/** What the latest event in the period did to the reading, stated only from the data. */
function eventSentence(series: LatencySeries, event: LatencyEvent, hoursAgo: number) {
  const before = mean(series.current.slice(Math.max(0, event.index - 6), event.index));
  const after = mean(series.current.slice(event.index, event.index + 6));
  const when = ago(hoursAgo);
  if (before !== null && after !== null && Math.abs(after - before) >= before * 0.1) {
    return ` It ${after > before ? 'rose' : 'fell'} after ${event.noun} ${when}.`;
  }
  return ` The latest event was ${event.noun}, ${when}.`;
}

/**
 * A trace over one faint stroke per sample; gaps stay gaps and "now" stays fixed. Events tick
 * the ruler (E1); with `forecast`, hollow samples are drawn 4 hours past "now" (E2, E3).
 */
export function LineChart({
  compact = false,
  drawing = false,
  forecast: showForecast = false,
}: {
  compact?: boolean;
  drawing?: boolean;
  forecast?: boolean;
}) {
  const [plotRef, width] = useChartWidth<HTMLDivElement>();
  const [series, setSeries] = useState(initialLatency);
  const simulation = useLiveSimulation(() => setSeries((current) => stepLatency(current)));
  const horizon = showForecast ? forecastSamples : 0;
  const inspection = useInspection(latencySamples + horizon);

  const height = (compact ? 176 : 216) + eventLane;
  const left = 36;
  const right = width - 8;
  const top = 12;
  const baseline = height - 34 - eventLane;
  const last = latencySamples - 1;
  const span = last + horizon;
  const x = (index: number) => left + (index * (right - left)) / span;
  const y = (value: number) => baseline - (value / latencyScaleMax) * (baseline - top);
  const { current, previous, events } = series;
  const projected = showForecast ? forecastLatency(series) : null;
  const active = inspection.active;
  const hoursAgo = (index: number) => (last - index) / 2;
  const when = (index: number) => {
    const hours = hoursAgo(index);
    if (hours === 0) return 'now';
    return hours > 0 ? `−${formatMinutes(hours)} h` : `+${formatMinutes(-hours)} h`;
  };
  const eventAt = (index: number) => events.find((event) => event.index === index);
  const forecastAt = (index: number) =>
    index > last ? (projected?.values[index - last - 1] ?? null) : null;

  let trace = '';
  current.forEach((value, index) => {
    if (value === null) return;
    const command = index === 0 || current[index - 1] === null ? 'M' : 'L';
    trace += `${command}${x(index).toFixed(1)} ${y(value).toFixed(1)}`;
  });
  const priorPoints = previous.map((value, index) => ({
    x: Number(x(index).toFixed(1)),
    y: Number(y(value).toFixed(1)),
  }));
  const prior = priorPoints
    .map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`)
    .join('');

  const latest = current[last] ?? null;
  const missing = current.filter((value) => value === null).length;
  const change = latest === null ? 0 : latest - previous[last]!;
  const latestEvent = events.reduce<LatencyEvent | null>(
    (found, event) => (found === null || event.index > found.index ? event : found),
    null,
  );
  const known = projected?.values.filter((value): value is number => value !== null) ?? [];
  const summary =
    (latest === null
      ? 'The latest p95 reading is missing.'
      : `p95 latency is ${latest} ms now, ${Math.abs(change)} ms ${
          change >= 0 ? 'above' : 'below'
        } the same time yesterday.`) +
    (latestEvent ? eventSentence(series, latestEvent, hoursAgo(latestEvent.index)) : '') +
    (missing
      ? ` ${spoken[missing] ?? missing} reading${missing === 1 ? ' is' : 's are'} missing.`
      : '') +
    (!showForecast
      ? ''
      : known.length
        ? ` The forecast follows yesterday's curve, shifted by today's average difference over the last 6 hours, and stays between ${Math.min(...known)} and ${Math.max(...known)} ms through +4 h.`
        : ' There is no forecast: fewer than 6 of the last 12 readings exist.');

  const readout = (() => {
    if (active === null) return `${latencySamples} samples · latest ${latest ?? '—'} ms`;
    if (active > last) {
      const value = forecastAt(active);
      return `${when(active)} · ${value === null ? 'no forecast' : `forecast ${value} ms`}`;
    }
    const event = eventAt(active);
    return `${when(active)} · ${current[active] === null ? 'no reading' : `${current[active]} ms`} · prev ${previous[active]} ms${event ? ` · ${event.label}` : ''}`;
  })();

  const ticks = Array.from({ length: span + 1 }, (_, index) => index)
    .filter((index) => (last - index) % 4 === 0)
    .map((index) => ({ x: x(index), major: (last - index) % 12 === 0 }));
  const majors = ticks.filter((tick) => tick.major);
  const nowX = x(last);
  const endLabel = '+4 h';
  const endLabelFits = showForecast && right - endLabel.length * captionAdvance >= nowX + 12 + 8;

  // Event labels share one lane; when two would touch, the later keeps its label (E1).
  const eventLabels: { event: LatencyEvent; start: number }[] = [];
  [...events]
    .sort((a, b) => b.index - a.index)
    .forEach((event) => {
      const labelWidth = event.label.length * captionAdvance;
      const start = Math.min(right - labelWidth, Math.max(left, x(event.index) - labelWidth / 2));
      const touches = eventLabels.some(
        (placed) =>
          start < placed.start + placed.event.label.length * captionAdvance + 8 &&
          placed.start < start + labelWidth + 8,
      );
      if (!touches) eventLabels.push({ event, start });
    });

  const pitch = (right - left) / span;
  const data = Array.from({ length: latencySamples + horizon }, (_, index) => {
    const event = eventAt(index);
    const value = index > last ? forecastAt(index) : current[index];
    return {
      x: x(index) - pitch / 2,
      y: 0,
      width: pitch,
      height,
      label:
        index > last
          ? `${when(index)}: ${value === null ? 'no forecast' : `forecast ${value} ms`}`
          : `${when(index)}: ${value === null ? 'no reading' : `${value} ms`}, previous ${previous[index]} ms${event ? `, ${event.name}` : ''}`,
    };
  });
  const table = {
    columns: [
      { label: 'Time' },
      { label: 'p95 (ms)', numeric: true },
      { label: 'Previous (ms)', numeric: true },
      ...(showForecast ? [{ label: 'Forecast (ms)', numeric: true }] : []),
      { label: 'Event' },
    ],
    rows: data.map((_, index) => {
      if (index > last) {
        const value = forecastAt(index);
        return [when(index), '', '', value === null ? 'No forecast' : `${value}`, ''];
      }
      const value = current[index];
      return [
        when(index),
        value === null ? 'No reading' : `${value}`,
        `${previous[index]}`,
        ...(showForecast ? [''] : []),
        eventAt(index)?.name ?? '',
      ];
    }),
  };
  const b = crisp(baseline);

  return (
    <ChartFrame
      kind={showForecast ? 'line-forecast' : 'line'}
      series="latency.p95"
      scale={showForecast ? '30 min samples · 4 h forecast' : '30 min samples'}
      title="p95 latency, last 24 hours"
      summary={summary}
      readout={readout}
      unit="ms"
      announcement={inspection.announcement}
      table={compact ? undefined : table}
      drawing={drawing}
      drawingLabel="Loading p95 latency"
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
          {[100, 200].map((value) => (
            <g key={value}>
              <line
                className="chart-structure"
                x1={left}
                x2={right}
                y1={crisp(y(value))}
                y2={crisp(y(value))}
                stroke="var(--zao-color-border-subtle)"
              />
              {!drawing && (
                <ChartLabel x={left - 8} y={y(value) + 4} anchor="end">
                  {value}
                </ChartLabel>
              )}
            </g>
          ))}
          {!drawing && (
            <ChartLabel x={left - 8} y={baseline + 4} anchor="end">
              0
            </ChartLabel>
          )}
          {!drawing &&
            current.map((value, index) =>
              value === null ? null : (
                <line
                  key={index}
                  data-zao-slot="chart-sample"
                  data-chart-ink="muted"
                  x1={crisp(x(index))}
                  x2={crisp(x(index))}
                  y1={b}
                  y2={y(value)}
                  stroke="var(--zao-color-border-subtle)"
                  strokeWidth="1"
                />
              ),
            )}
          <Ruler x0={left} x1={right} y={baseline} ticks={ticks} />
          {!drawing && (
            <>
              {majors.map((tick, index) => {
                const isNow = index === majors.length - 1;
                return (
                  <ChartLabel
                    key={tick.x}
                    x={tick.x}
                    y={baseline + 22}
                    anchor={isNow && !showForecast ? 'end' : 'middle'}
                  >
                    {isNow ? 'now' : `−${(majors.length - 1 - index) * 6} h`}
                  </ChartLabel>
                );
              })}
              {endLabelFits && (
                <ChartLabel x={right} y={baseline + 22} anchor="end">
                  {endLabel}
                </ChartLabel>
              )}
              {events.map((event) => {
                const tickX = crisp(x(event.index));
                return (
                  <line
                    key={`${event.label}-${event.name}`}
                    data-zao-slot="chart-event"
                    data-chart-ink="muted"
                    x1={tickX}
                    x2={tickX}
                    y1={b - 6}
                    y2={b + 10}
                    stroke="var(--zao-color-fg-muted)"
                    strokeWidth="1"
                  />
                );
              })}
              {eventLabels.map(({ event, start }) => (
                <g key={event.name} data-zao-slot="chart-event-label">
                  <ChartLabel x={start} y={baseline + 38} anchor="start">
                    {event.label}
                  </ChartLabel>
                </g>
              ))}
              <path
                data-zao-slot="chart-reference"
                data-chart-ink="muted"
                d={prior}
                fill="none"
                stroke="var(--zao-color-fg-muted)"
                strokeWidth="1"
                strokeDasharray={fittedDash(polylineLength(priorPoints))}
              />
              <path
                data-zao-slot="chart-mark"
                data-chart-ink="data"
                d={trace}
                fill="none"
                stroke="var(--zao-color-fg-default)"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {projected?.values.map((value, step) =>
                value === null ? null : (
                  <rect
                    key={step}
                    data-zao-slot="chart-forecast"
                    data-chart-ink="muted"
                    x={Math.round(x(last + step + 1) - 2.5) + 0.5}
                    y={Math.round(y(value) - 2.5) + 0.5}
                    width="4"
                    height="4"
                    fill="none"
                    stroke="var(--zao-color-fg-muted)"
                    strokeWidth="1"
                  />
                ),
              )}
              {active !== null && (
                <g data-zao-slot="chart-guide">
                  <line
                    data-chart-ink="muted"
                    x1={crisp(x(active))}
                    x2={crisp(x(active))}
                    y1={top}
                    y2={b}
                    stroke="var(--zao-color-fg-muted)"
                    strokeWidth="1"
                  />
                  {active <= last && current[active] !== null && (
                    <rect
                      data-chart-fill
                      x={Math.round(x(active) - 2.5)}
                      y={Math.round(y(current[active]!) - 2.5)}
                      width="5"
                      height="5"
                      fill="var(--zao-color-fg-default)"
                    />
                  )}
                </g>
              )}
              {latest !== null && <AccentSquare x={x(last)} y={y(latest)} />}
            </>
          )}
        </svg>
        {!drawing && (
          <ChartInspector
            inspection={inspection}
            data={data}
            width={width}
            height={height}
            name="p95 latency samples"
          />
        )}
      </div>
    </ChartFrame>
  );
}
