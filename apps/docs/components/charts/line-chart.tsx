'use client';

import { useState } from 'react';
import { AccentSquare, ChartFrame, ChartLabel, Ruler } from './chart-frame';
import { ChartInspector, useInspection } from './chart-inspector';
import {
  formatMinutes,
  initialLatency,
  latencySamples,
  latencyScaleMax,
  stepLatency,
} from './data';
import { crisp, useChartWidth } from './use-chart-width';
import { LiveSimulationSwitch, useLiveSimulation } from './use-live-simulation';

const spoken = ['No', 'One', 'Two', 'Three', 'Four', 'Five'];

/** A trace over one faint stroke per sample; gaps stay gaps and "now" stays fixed. */
export function LineChart({ compact = false }: { compact?: boolean }) {
  const [plotRef, width] = useChartWidth<HTMLDivElement>();
  const [series, setSeries] = useState(initialLatency);
  const simulation = useLiveSimulation(() => setSeries((current) => stepLatency(current)));
  const inspection = useInspection(latencySamples);

  const height = compact ? 176 : 216;
  const left = 36;
  const right = width - 8;
  const top = 12;
  const baseline = height - 34;
  const last = latencySamples - 1;
  const x = (index: number) => left + (index * (right - left)) / last;
  const y = (value: number) => baseline - (value / latencyScaleMax) * (baseline - top);
  const { current, previous } = series;
  const active = inspection.active;
  const hoursAgo = (index: number) => (last - index) / 2;
  const when = (index: number) =>
    hoursAgo(index) === 0 ? 'now' : `−${formatMinutes(hoursAgo(index))} h`;

  let trace = '';
  current.forEach((value, index) => {
    if (value === null) return;
    const command = index === 0 || current[index - 1] === null ? 'M' : 'L';
    trace += `${command}${x(index).toFixed(1)} ${y(value).toFixed(1)}`;
  });
  const prior = previous
    .map((value, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`)
    .join('');

  const latest = current[last] ?? null;
  const missing = current.filter((value) => value === null).length;
  const change = latest === null ? 0 : latest - previous[last]!;
  const summary =
    (latest === null
      ? 'The latest p95 reading is missing.'
      : `p95 latency is ${latest} ms now, ${Math.abs(change)} ms ${
          change >= 0 ? 'above' : 'below'
        } the same time yesterday.`) +
    (missing
      ? ` ${spoken[missing] ?? missing} reading${missing === 1 ? ' is' : 's are'} missing.`
      : '');
  const readout =
    active === null
      ? `${latencySamples} samples · latest ${latest ?? '—'} ms`
      : `${when(active)} · ${current[active] === null ? 'no reading' : `${current[active]} ms`} · prev ${previous[active]} ms`;

  const ticks = Array.from({ length: latencySamples }, (_, index) => index)
    .filter((index) => (last - index) % 4 === 0)
    .map((index) => ({ x: x(index), major: (last - index) % 12 === 0 }));
  const data = current.map((value, index) => ({
    x: x(index) - (right - left) / last / 2,
    y: 0,
    width: (right - left) / last,
    height,
    label: `${when(index)}: ${value === null ? 'no reading' : `${value} ms`}, previous ${previous[index]} ms`,
  }));

  return (
    <ChartFrame
      kind="line"
      series="latency.p95"
      scale="30 min samples"
      title="p95 latency, last 24 hours"
      summary={summary}
      readout={readout}
      unit="ms"
      announcement={inspection.announcement}
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
              <ChartLabel x={left - 8} y={y(value) + 4} anchor="end">
                {value}
              </ChartLabel>
            </g>
          ))}
          <ChartLabel x={left - 8} y={baseline + 4} anchor="end">
            0
          </ChartLabel>
          {current.map((value, index) =>
            value === null ? null : (
              <line
                key={index}
                data-zao-slot="chart-sample"
                data-chart-ink="muted"
                x1={crisp(x(index))}
                x2={crisp(x(index))}
                y1={crisp(baseline)}
                y2={y(value)}
                stroke="var(--zao-color-border-subtle)"
                strokeWidth="1"
              />
            ),
          )}
          <Ruler x0={left} x1={right} y={baseline} ticks={ticks} />
          {ticks
            .filter((tick) => tick.major)
            .map((tick, index, majors) => (
              <ChartLabel
                key={tick.x}
                x={tick.x}
                y={baseline + 22}
                anchor={index === majors.length - 1 ? 'end' : 'middle'}
              >
                {index === majors.length - 1 ? 'now' : `−${(majors.length - 1 - index) * 6} h`}
              </ChartLabel>
            ))}
          <path
            data-zao-slot="chart-reference"
            data-chart-ink="muted"
            d={prior}
            fill="none"
            stroke="var(--zao-color-fg-muted)"
            strokeWidth="1"
            strokeDasharray="2 3"
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
          {active !== null && (
            <g data-zao-slot="chart-guide">
              <line
                data-chart-ink="muted"
                x1={crisp(x(active))}
                x2={crisp(x(active))}
                y1={top}
                y2={crisp(baseline)}
                stroke="var(--zao-color-fg-muted)"
                strokeWidth="1"
              />
              {current[active] !== null && (
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
        </svg>
        <ChartInspector
          inspection={inspection}
          data={data}
          width={width}
          height={height}
          name="p95 latency samples"
        />
      </div>
    </ChartFrame>
  );
}
