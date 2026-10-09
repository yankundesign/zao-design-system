'use client';

import { useState } from 'react';
import { AccentSquare, ChartFrame, ChartLabel, Ruler } from './chart-frame';
import { ChartInspector, useInspection } from './chart-inspector';
import { regionCalls, regions, regionScaleMax, stepRegionCalls } from './data';
import { crisp, useChartWidth } from './use-chart-width';
import { LiveSimulationSwitch, useLiveSimulation } from './use-live-simulation';

const count = new Intl.NumberFormat('en-US');

/** Bars as needles with square heads on one baseline; the lead bar carries the accent. */
export function BarChart({ compact = false }: { compact?: boolean }) {
  const [plotRef, width] = useChartWidth<HTMLDivElement>();
  const [values, setValues] = useState(regionCalls);
  const simulation = useLiveSimulation(() => setValues((current) => stepRegionCalls(current)));
  const inspection = useInspection(values.length);

  const height = compact ? 176 : 216;
  const left = 8;
  const right = width - 8;
  const top = 28;
  const baseline = height - 30;
  const slot = (right - left) / values.length;
  const y = (value: number) => baseline - (value / regionScaleMax) * (baseline - top);
  const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const lead = values.indexOf(Math.max(...values));
  const active = inspection.active;
  const versus = (value: number) => {
    const difference = value - average;
    return `${difference >= 0 ? '+' : '−'}${Math.abs(difference)} vs avg`;
  };

  const data = values.map((value, index) => ({
    x: left + slot * index,
    y: 0,
    width: slot,
    height,
    label: `${regions[index]!.name}: ${count.format(value)} calls`,
  }));
  const readout =
    active === null
      ? `${values.length} regions · avg ${average}`
      : `${regions[active]!.id} · ${count.format(values[active]!)} calls · ${versus(values[active]!)}`;
  const summary = `${regions[lead]!.name} leads with ${count.format(values[lead]!)} calls, ${
    values[lead]! - average
  } above the ${average} average.`;
  const averageY = crisp(y(average));

  return (
    <ChartFrame
      kind="bar"
      series="calls.by_region"
      scale="last 24 h"
      title="Calls by region"
      summary={summary}
      readout={readout}
      unit="calls"
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
          <Ruler x0={left} x1={right} y={baseline} />
          <line
            data-zao-slot="chart-reference"
            data-chart-ink="muted"
            x1={left}
            x2={right}
            y1={averageY}
            y2={averageY}
            stroke="var(--zao-color-fg-muted)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <ChartLabel x={right} y={averageY - 6} anchor="end">
            avg {average}
          </ChartLabel>
          {values.map((value, index) => {
            const x = crisp(left + slot * (index + 0.5));
            const head = y(value);
            const emphasized = index === lead || index === active;
            const ink = emphasized ? 'var(--zao-color-fg-default)' : 'var(--zao-color-fg-muted)';
            return (
              <g
                key={regions[index]!.id}
                data-zao-slot="chart-mark"
                data-state={index === active ? 'active' : index === lead ? 'lead' : 'rest'}
              >
                <line
                  data-chart-ink={emphasized ? 'data' : 'muted'}
                  x1={x}
                  x2={x}
                  y1={crisp(baseline)}
                  y2={head}
                  stroke={ink}
                  strokeWidth="1.5"
                />
                {index === lead ? (
                  <AccentSquare x={x} y={head} />
                ) : (
                  <rect
                    data-chart-fill
                    x={Math.round(x - 3)}
                    y={Math.round(head - 3)}
                    width="6"
                    height="6"
                    fill={ink}
                  />
                )}
                <ChartLabel x={x} y={head - 9} strong={emphasized}>
                  {count.format(value)}
                </ChartLabel>
                <ChartLabel x={x} y={baseline + 20} strong={index === active}>
                  {regions[index]!.id}
                </ChartLabel>
              </g>
            );
          })}
        </svg>
        <ChartInspector
          inspection={inspection}
          data={data}
          width={width}
          height={height}
          name="calls by region"
        />
      </div>
    </ChartFrame>
  );
}
