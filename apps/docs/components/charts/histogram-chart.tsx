'use client';

import { useState } from 'react';
import { AccentSquare, ChartFrame, ChartLabel, Ruler } from './chart-frame';
import { ChartInspector, useInspection } from './chart-inspector';
import {
  formatMinutes,
  initialSessions,
  sessionBinMinutes,
  sessionBins,
  stepSessions,
} from './data';
import { crisp, useChartWidth } from './use-chart-width';
import { LiveSimulationSwitch, useLiveSimulation } from './use-live-simulation';

const count = new Intl.NumberFormat('en-US');
/** Combs tighter than this shimmer; merge bins instead. */
const minimumPitch = 3;

function binLabel(minutes: number) {
  return minutes < 1 ? `${minutes * 60} s` : `${minutes} min`;
}

/** A comb of hairlines, one per bin: the instrument's ring, unrolled. */
export function HistogramChart({ compact = false }: { compact?: boolean }) {
  const [plotRef, width] = useChartWidth<HTMLDivElement>();
  const [series, setSeries] = useState(initialSessions);
  const simulation = useLiveSimulation(() => setSeries((current) => stepSessions(current)));

  const left = 8;
  const right = width - 8;
  const plotWidth = right - left;
  const factor = [1, 2, 4].find((merge) => plotWidth / (sessionBins / merge) >= minimumPitch) ?? 4;
  const binCount = sessionBins / factor;
  const binMinutes = sessionBinMinutes * factor;
  const bins = Array.from({ length: binCount }, (_, index) =>
    series.bins
      .slice(index * factor, index * factor + factor)
      .reduce((sum, value) => sum + value, 0),
  );
  const latest = Math.floor(series.latest / factor);
  const inspection = useInspection(binCount);

  const height = compact ? 176 : 216;
  const top = 24;
  const baseline = height - 34;
  const pitch = plotWidth / binCount;
  const x = (index: number) => left + pitch * (index + 0.5);
  const peak = Math.max(...bins);
  const scaleMax = Math.ceil((peak * 1.15) / 25) * 25;
  const y = (value: number) => baseline - (value / scaleMax) * (baseline - top);
  const active = inspection.active;

  const total = bins.reduce((sum, value) => sum + value, 0);
  let running = 0;
  let median = 0;
  for (let index = 0; index < binCount; index += 1) {
    running += bins[index]!;
    if (running >= total / 2) {
      median = index;
      break;
    }
  }
  const mode = bins.indexOf(peak);
  const medianMinutes = (median + 1) * binMinutes;
  let p90 = binCount - 1;
  running = 0;
  for (let index = 0; index < binCount; index += 1) {
    running += bins[index]!;
    if (running >= total * 0.9) {
      p90 = index;
      break;
    }
  }
  const range = (index: number) =>
    `${formatMinutes(index * binMinutes)}–${formatMinutes((index + 1) * binMinutes)} min`;
  const summary = `Half of sessions end within ${formatMinutes(medianMinutes)} minutes, and 90% end within ${formatMinutes(
    (p90 + 1) * binMinutes,
  )} minutes. The most common length is ${range(mode)}.`;
  const readout =
    active === null
      ? `${count.format(total)} sessions · p50 ${formatMinutes(medianMinutes)} min`
      : `${range(active)} · ${count.format(bins[active]!)} sessions${active === latest ? ' · latest' : ''}`;
  const ticks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map((minute) => ({
    x: left + (minute / 60) * plotWidth,
    major: minute % 15 === 0,
  }));
  const medianX = crisp(left + ((median + 1) / binCount) * plotWidth);
  const data = bins.map((value, index) => ({
    x: left + pitch * index,
    y: 0,
    width: pitch,
    height,
    label: `${range(index)}: ${count.format(value)} sessions${index === latest ? ', latest' : ''}`,
  }));

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
          <line
            data-zao-slot="chart-reference"
            data-chart-ink="muted"
            x1={medianX}
            x2={medianX}
            y1={top - 8}
            y2={crisp(baseline)}
            stroke="var(--zao-color-fg-muted)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <ChartLabel x={medianX + 6} y={top - 4} anchor="start">
            p50 {formatMinutes(medianMinutes)} min
          </ChartLabel>
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
          <Ruler x0={left} x1={right} y={baseline} ticks={ticks} />
          {ticks
            .filter((tick) => tick.major)
            .map((tick, index, majors) => (
              <ChartLabel
                key={tick.x}
                x={tick.x}
                y={baseline + 22}
                anchor={index === 0 ? 'start' : index === majors.length - 1 ? 'end' : 'middle'}
              >
                {index === majors.length - 1 ? '60 min' : index * 15}
              </ChartLabel>
            ))}
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
        </svg>
        <ChartInspector
          inspection={inspection}
          data={data}
          width={width}
          height={height}
          name="session length bins"
        />
      </div>
    </ChartFrame>
  );
}
