'use client';

import { useState } from 'react';
import { ChartFrame, ChartLabel } from './chart-frame';
import { ChartInspector, useInspection } from './chart-inspector';
import {
  activityStep,
  activitySteps,
  initialActivity,
  isFutureCell,
  nowCell,
  weekdayNames,
  weekdays,
} from './data';
import { crisp, useChartWidth } from './use-chart-width';
import { LiveSimulationSwitch, useLiveSimulation } from './use-live-simulation';

/**
 * Five evenly spaced mixes of default ink into the canvas. Mixing two semantic
 * roles keeps the order in Su light and dark and in any study; the percentages are
 * study values until Yankun chooses a data ramp (DV3).
 */
const ramp = [14, 32, 52, 74, 100].map(
  (ink) => `color-mix(in oklab, var(--zao-color-fg-default) ${ink}%, var(--zao-color-bg-canvas))`,
);
const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

/** Square cells in five gray steps; the current hour gets accent brackets. */
export function HeatmapChart({ compact = false }: { compact?: boolean }) {
  const [plotRef, width] = useChartWidth<HTMLDivElement>();
  const [values, setValues] = useState(initialActivity);
  const simulation = useLiveSimulation(() =>
    setValues((rows) =>
      rows.map((row, day) =>
        row.map((value, hour) =>
          day === nowCell.day && hour === nowCell.hour && value !== null
            ? Math.min(64, value + 1 + Math.floor(Math.random() * 3))
            : value,
        ),
      ),
    ),
  );
  const inspection = useInspection(7 * 24);

  const left = 36;
  const pitch = Math.max(8, Math.min(compact ? 20 : 28, Math.floor((width - left - 4) / 24)));
  const cell = pitch - 2;
  const top = 4;
  const gridBottom = top + pitch * 7;
  const legendStep = 44;
  const wrapLegend = left + legendStep * 5 + 112 > width;
  const legendY = gridBottom + 40;
  const height = legendY + (wrapLegend ? 28 : 8);
  const active = inspection.active;

  let peak = { day: 0, hour: 0, value: -1 };
  let total = 0;
  values.forEach((row, day) =>
    row.forEach((value, hour) => {
      if (value === null) return;
      total += value;
      if (value > peak.value) peak = { day, hour, value };
    }),
  );
  const describe = (day: number, hour: number) => {
    const value = values[day]![hour] ?? null;
    const now = day === nowCell.day && hour === nowCell.hour;
    return {
      value,
      now,
      text: value === null ? 'no data yet' : `${value} events`,
    };
  };
  const data = values.flatMap((row, day) =>
    row.map((_, hour) => {
      const { text, now } = describe(day, hour);
      return {
        x: left + hour * pitch - 1,
        y: top + day * pitch - 1,
        width: pitch,
        height: pitch,
        label: `${weekdayNames[day]} ${hourLabel(hour)}: ${text}${now ? ', now' : ''}`,
      };
    }),
  );
  const readout = (() => {
    if (active === null)
      return `${total} events so far · peak ${weekdays[peak.day]} ${hourLabel(peak.hour)}`;
    const day = Math.floor(active / 24);
    const hour = active % 24;
    const { text, now } = describe(day, hour);
    return `${weekdays[day]} ${hourLabel(hour)} · ${text}${now ? ' · now' : ''}`;
  })();
  const summary = `Weekday mornings and afternoons are busiest; the peak is ${weekdayNames[peak.day]} at ${hourLabel(
    peak.hour,
  )} with ${peak.value} events. The rest of this week has no data yet.`;

  const bracket = (() => {
    const x0 = left + nowCell.hour * pitch - 2.5;
    const y0 = top + nowCell.day * pitch - 2.5;
    const x1 = x0 + cell + 4;
    const y1 = y0 + cell + 4;
    const arm = Math.min(4, cell / 2);
    return [
      `M${x0} ${y0 + arm}V${y0}H${x0 + arm}`,
      `M${x1 - arm} ${y0}H${x1}V${y0 + arm}`,
      `M${x0} ${y1 - arm}V${y1}H${x0 + arm}`,
      `M${x1 - arm} ${y1}H${x1}V${y1 - arm}`,
    ].join('');
  })();

  return (
    <ChartFrame
      kind="heatmap"
      series="events.by_hour"
      scale="this week"
      title="Events per hour"
      summary={summary}
      readout={readout}
      unit="events"
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
          {weekdays.map((name, day) =>
            // Below 14px rows, label every other day so caption text never overlaps.
            pitch < 14 && day % 2 === 1 ? null : (
              <ChartLabel key={name} x={left - 8} y={top + day * pitch + cell / 2 + 4} anchor="end">
                {name}
              </ChartLabel>
            ),
          )}
          {values.map((row, day) =>
            row.map((value, hour) => {
              const x = left + hour * pitch;
              const y = top + day * pitch;
              if (value === null || isFutureCell(day, hour)) {
                return (
                  <rect
                    key={`${day}-${hour}`}
                    data-zao-slot="chart-unknown"
                    data-chart-fill
                    x={Math.round(x + cell / 2 - 1)}
                    y={Math.round(y + cell / 2 - 1)}
                    width="2"
                    height="2"
                    fill="var(--zao-color-fg-muted)"
                  />
                );
              }
              return (
                <rect
                  key={`${day}-${hour}`}
                  data-zao-slot="chart-mark"
                  data-step={activityStep(value)}
                  x={x}
                  y={y}
                  width={cell}
                  height={cell}
                  fill={ramp[activityStep(value)]}
                />
              );
            }),
          )}
          {active !== null && (
            <rect
              data-zao-slot="chart-guide"
              data-chart-ink="data"
              x={crisp(left + (active % 24) * pitch - 2)}
              y={crisp(top + Math.floor(active / 24) * pitch - 2)}
              width={cell + 3}
              height={cell + 3}
              fill="none"
              stroke="var(--zao-color-fg-default)"
              strokeWidth="1"
            />
          )}
          <path
            data-zao-slot="chart-accent"
            className="chart-accent-stroke"
            d={bracket}
            fill="none"
            stroke="var(--zao-color-accent-solid)"
            strokeWidth="1.5"
          />
          {[0, 6, 12, 18].map((hour) => (
            <ChartLabel key={hour} x={left + hour * pitch} y={gridBottom + 14} anchor="start">
              {String(hour).padStart(2, '0')}
            </ChartLabel>
          ))}
          <g data-zao-slot="chart-legend">
            {activitySteps.map((bound, step) => (
              <g key={bound}>
                <rect
                  x={left + step * legendStep}
                  y={legendY - 9}
                  width="10"
                  height="10"
                  fill={ramp[step]}
                />
                <ChartLabel x={left + step * legendStep + 14} y={legendY} anchor="start">
                  {step === activitySteps.length - 1 ? `${bound}+` : bound}
                </ChartLabel>
              </g>
            ))}
            <g
              transform={
                wrapLegend
                  ? `translate(${left} ${legendY + 20})`
                  : `translate(${left + legendStep * 5 + 4} ${legendY})`
              }
            >
              <rect
                data-chart-fill
                x="4"
                y="-5"
                width="2"
                height="2"
                fill="var(--zao-color-fg-muted)"
              />
              <ChartLabel x={14} y={0} anchor="start">
                no data yet
              </ChartLabel>
            </g>
          </g>
        </svg>
        <ChartInspector
          inspection={inspection}
          data={data}
          width={width}
          height={gridBottom}
          name="events per hour"
          columns={24}
          nearest="box"
        />
      </div>
    </ChartFrame>
  );
}
