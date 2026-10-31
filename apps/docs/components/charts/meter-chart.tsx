'use client';

import { Meter } from '@base-ui/react/meter';
import { useState } from 'react';
import { AccentSquare, ChartFrame, ChartLabel, Ruler, fittedDash } from './chart-frame';
import { ChartInspector, useInspection } from './chart-inspector';
import { octoberSpend, stepSpend } from './data';
import type { SpendReading } from './data';
import { crisp, useChartWidth } from './use-chart-width';
import { LiveSimulationSwitch, useLiveSimulation } from './use-live-simulation';

function usd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Matches Progress's track: the meter reuses its well, face and contact edge. */
const wellHeight = 8;
const wellTop = 28;
const rulerY = 50;
const height = 80;

type Region = 'used' | 'left' | 'over';

/** What the month-to-date rate says about the rest of the period, if it is still running. */
function project(reading: SpendReading & { spent: number; budget: number }) {
  if (reading.day >= reading.days || reading.spent <= 0) return null;
  const rate = reading.spent / reading.day;
  const crosses = (threshold: number) =>
    reading.spent < threshold && rate * reading.days >= threshold
      ? Math.ceil(threshold / rate)
      : null;
  return {
    total: Math.round(rate * reading.days),
    alertDay: reading.alert === undefined ? null : crosses(reading.alert),
    budgetDay: crosses(reading.budget),
  };
}

/**
 * How close a measure is to its limit: Progress's recessed well, measured. A dashed alert,
 * a drawn projection (C4) and a written overage (C5).
 */
export function MeterChart({
  compact = false,
  drawing = false,
  reading: initial = octoberSpend,
  title = 'Cloud spend, October',
}: {
  compact?: boolean;
  drawing?: boolean;
  reading?: SpendReading;
  title?: string;
}) {
  const [plotRef, width] = useChartWidth<HTMLDivElement>();
  const [reading, setReading] = useState(initial);
  const simulation = useLiveSimulation(() => setReading((current) => stepSpend(current)));

  const { spent, budget, alert, month, days } = reading;
  const unknown = spent === null;
  const measurable = !unknown && budget !== null && budget > 0;
  const regions: Region[] = measurable
    ? spent > budget
      ? ['used', 'over']
      : ['used', 'left']
    : [];
  const inspection = useInspection(regions.length);

  const left = 8;
  // Room past the end stop for the over mark.
  const right = width - 20;
  const span = right - left;
  const x = (value: number) => left + Math.min(1, Math.max(0, value / (budget ?? 1))) * span;
  const wellBottom = wellTop + wellHeight;
  const ticks = [0.25, 0.5, 0.75].map((share) => ({ x: left + share * span }));

  const percent = (value: number) => Math.round((value / budget!) * 100);
  const projection = measurable ? project({ ...reading, spent, budget }) : null;
  const active = inspection.active === null ? null : regions[inspection.active]!;

  const summary = (() => {
    if (!measurable) return 'No budget is set, so spend has nothing to be measured against.';
    if (spent > budget)
      return `${usd(spent)} spent, ${usd(spent - budget)} over the ${usd(budget)} budget.`;
    let text = `${usd(spent)} spent, ${percent(spent)}% of the ${usd(budget)} budget.`;
    if (projection) {
      const crossings = [
        projection.alertDay !== null && alert !== undefined
          ? `crosses the ${usd(alert)} alert on ${month} ${projection.alertDay}`
          : null,
        projection.budgetDay !== null
          ? `passes the budget on ${month} ${projection.budgetDay}`
          : null,
      ].filter(Boolean);
      text += ` At the month-to-date rate, spend reaches ${usd(projection.total)} by ${month} ${days}${
        crossings.length ? ` and ${crossings.join(' and ')}` : ''
      }.`;
    } else if (alert !== undefined && spent >= alert) {
      text += ` That is past the ${usd(alert)} alert.`;
    }
    return text;
  })();

  const describe = (region: Region) => {
    if (!measurable) return { name: '', amount: 0, share: 0 };
    if (region === 'used')
      return {
        name: 'Used',
        amount: Math.min(spent, budget),
        share: percent(Math.min(spent, budget)),
      };
    if (region === 'left')
      return { name: 'Left', amount: budget - spent, share: 100 - percent(spent) };
    return { name: 'Over', amount: spent - budget, share: percent(spent - budget) };
  };
  const readout = (() => {
    if (!measurable) return 'No budget set';
    if (active) {
      const { name, amount, share } = describe(active);
      return `${name} · ${usd(amount)} · ${share}%`;
    }
    return spent > budget
      ? `Over by ${usd(spent - budget)}`
      : `${percent(spent)}% used · ${usd(budget - spent)} left`;
  })();

  const boxes = measurable
    ? regions.map((region) => {
        const { name, amount, share } = describe(region);
        const [from, to] =
          region === 'used'
            ? [left, x(spent)]
            : region === 'left'
              ? [x(spent), right]
              : [right, width];
        return {
          x: from,
          y: 0,
          width: to - from,
          height,
          label:
            region === 'over'
              ? `Over: ${usd(amount)} past the budget`
              : `${name}: ${usd(amount)}, ${share}% of the budget`,
        };
      })
    : [];

  const table = measurable
    ? {
        columns: [
          { label: 'Measure' },
          { label: 'Amount', numeric: true },
          { label: 'Share of budget', numeric: true },
        ],
        rows: [
          ['Spent', usd(spent), `${percent(spent)}%`],
          spent > budget
            ? ['Over', usd(spent - budget), `${percent(spent - budget)}%`]
            : ['Left', usd(budget - spent), `${100 - percent(spent)}%`],
          ['Budget', usd(budget), '100%'],
          ...(alert === undefined ? [] : [['Alert', usd(alert), `${percent(alert)}%`]]),
          ...(projection
            ? [
                [
                  `Projected by ${month} ${days}`,
                  usd(projection.total),
                  `${percent(projection.total)}%`,
                ],
              ]
            : []),
        ],
      }
    : undefined;

  const drawn = drawing || unknown;
  const alertX = alert !== undefined && measurable ? crisp(x(alert)) : null;

  return (
    <ChartFrame
      kind="meter"
      series="budget.spend"
      scale={budget ? `${month} 1–${days} · budget ${usd(budget)}` : `${month} 1–${days}`}
      title={title}
      summary={summary}
      readout={readout}
      unit="USD"
      announcement={inspection.announcement}
      table={compact ? undefined : table}
      drawing={drawn}
      drawingLabel="Loading cloud spend"
      controls={
        compact ? undefined : (
          <LiveSimulationSwitch
            running={simulation.running}
            onRunningChange={simulation.setRunning}
          />
        )
      }
    >
      <div ref={plotRef} className="chart-plot chart-meter" style={{ height }}>
        {measurable && !drawn ? (
          <Meter.Root
            value={Math.min(spent, budget)}
            max={budget}
            aria-label={`${title} against its budget`}
            aria-valuetext={readout}
            className="progress-construction absolute"
            style={{ left, top: wellTop, width: span }}
          >
            <Meter.Track data-zao-slot="track">
              <Meter.Indicator data-zao-slot="indicator" />
            </Meter.Track>
          </Meter.Root>
        ) : (
          <svg
            className="absolute top-0 left-0"
            width={width}
            height={height}
            aria-hidden="true"
            focusable="false"
          >
            <rect
              data-zao-slot="chart-well"
              className="chart-structure"
              stroke="var(--zao-color-border-default)"
              x={crisp(left)}
              y={crisp(wellTop)}
              width={span - 1}
              height={wellHeight - 1}
            />
          </svg>
        )}
        <svg
          className="pointer-events-none absolute top-0 left-0"
          width={width}
          height={height}
          aria-hidden="true"
          focusable="false"
        >
          <Ruler x0={left} x1={right} y={rulerY} ticks={ticks} />
          {measurable && !drawn && (
            <>
              {projection && projection.total > spent && (
                <rect
                  data-zao-slot="chart-projection"
                  data-chart-ink="muted"
                  x={crisp(x(spent))}
                  y={crisp(wellTop)}
                  width={Math.max(0, Math.round(x(projection.total) - x(spent)) - 1)}
                  height={wellHeight - 1}
                  fill="none"
                  stroke="var(--zao-color-fg-muted)"
                  strokeWidth="1"
                />
              )}
              {alertX !== null && (
                <>
                  <line
                    data-zao-slot="chart-reference"
                    data-chart-ink="muted"
                    x1={alertX}
                    x2={alertX}
                    y1={wellTop - 6}
                    y2={wellBottom + 6}
                    stroke="var(--zao-color-fg-muted)"
                    strokeWidth="1"
                    strokeDasharray={fittedDash(wellHeight + 12)}
                  />
                  <ChartLabel
                    x={alertX}
                    y={wellTop - 12}
                    anchor={alertX > right - 48 ? 'end' : 'middle'}
                  >
                    alert {usd(alert!)}
                  </ChartLabel>
                </>
              )}
              {spent > budget && (
                <rect
                  data-zao-slot="chart-over"
                  data-chart-fill
                  x={Math.round(right + 6)}
                  y={wellTop + 1}
                  width="6"
                  height="6"
                  fill="var(--zao-color-fg-default)"
                />
              )}
              <AccentSquare x={x(spent)} y={rulerY} />
              <ChartLabel x={left} y={height - 8} anchor="start">
                $0
              </ChartLabel>
              <ChartLabel x={right} y={height - 8} anchor="end" strong={active === 'left'}>
                {usd(budget)}
              </ChartLabel>
            </>
          )}
        </svg>
        {measurable && !drawn && (
          <ChartInspector
            inspection={inspection}
            data={boxes}
            width={width}
            height={height}
            name="cloud spend regions"
            nearest="box"
          />
        )}
      </div>
    </ChartFrame>
  );
}

const states: { name: string; reading: SpendReading }[] = [
  { name: 'Zero', reading: { ...octoberSpend, spent: 0, day: 31 } },
  { name: 'Fractional', reading: { ...octoberSpend, spent: 1234.56, day: 31 } },
  { name: 'Full', reading: { ...octoberSpend, spent: 6000, day: 31 } },
  { name: 'Over', reading: { ...octoberSpend, spent: 6310, day: 31 } },
  { name: 'Unknown', reading: { ...octoberSpend, spent: null } },
  { name: 'No budget', reading: { ...octoberSpend, budget: null, alert: undefined, day: 31 } },
];

/** Every meter state the guideline asks a chart input to define, as finished readings. */
export function MeterStates() {
  return (
    <ul className="grid min-w-0 gap-4 md:grid-cols-2">
      {states.map((state) => (
        <li
          key={state.name}
          data-zao-meter-state={state.name.toLowerCase().replace(' ', '-')}
          className="flex min-w-0 flex-col gap-3 rounded-surface border border-subtle p-4"
        >
          <h3 className="type-label font-medium">{state.name}</h3>
          <MeterChart
            compact
            reading={state.reading}
            title={`Cloud spend, ${state.name.toLowerCase()}`}
          />
        </li>
      ))}
    </ul>
  );
}
