'use client';

import { ChartFrame, ChartLabel, Ruler } from './chart-frame';
import { ChartInspector, useInspection } from './chart-inspector';
import { storageKinds, wholeShares } from './data';
import type { SharePart } from './data';
import { crisp, useChartWidth } from './use-chart-width';

/** Combs tighter than this shimmer; merge strokes instead, as the histogram merges bins. */
const minimumPitch = 3;
/** Geist Mono's advance at the caption role's 12px, for fitting labels over their groups. */
const captionAdvance = 7.4;

const labelY = 14;
/** Stroke length: one length for every stroke (C6). */
const strokeLength = 60;

/**
 * How a whole divides among two to five parts: one stroke per percentage point, grouped by
 * part. Every stroke has one length; the lead or inspected part carries full ink (C6).
 */
export function ShareStrip({
  compact = false,
  drawing = false,
  parts = storageKinds,
  series = 'storage.by_kind',
  title = 'Storage by kind',
}: {
  compact?: boolean;
  drawing?: boolean;
  parts?: readonly SharePart[];
  series?: string;
  title?: string;
}) {
  const [plotRef, width] = useChartWidth<HTMLDivElement>();
  const inspection = useInspection(parts.length);

  const left = 8;
  const right = width - 8;
  const plotWidth = right - left;
  const total = parts.reduce((sum, part) => sum + part.size, 0);
  const percents = wholeShares(
    parts.map((part) => part.size),
    100,
  );
  const drawnParts = percents.filter((value) => value > 0).length;
  const count = plotWidth / (100 + drawnParts - 1) >= minimumPitch ? 100 : 50;
  const strokes =
    count === 100
      ? percents
      : wholeShares(
          parts.map((part) => part.size),
          50,
        );
  const pitch = plotWidth / (count + strokes.filter((value) => value > 0).length - 1);

  // Lay out groups: one pitch of gap between parts that have strokes.
  let slot = 0;
  const groups = strokes.map((value) => {
    if (value === 0) return null;
    const start = slot;
    slot += value + 1;
    return {
      from: left + start * pitch,
      xs: Array.from({ length: value }, (_, index) => left + (start + index + 0.5) * pitch),
    };
  });
  const lead = percents.indexOf(Math.max(...percents));
  const leadGroup = groups[lead] ?? null;
  const active = inspection.active;
  const emphasized = active ?? lead;
  const label = (index: number) =>
    `${parts[index]!.id} ${percents[index]! > 0 ? `${percents[index]}%` : '<1%'}`;
  const fits = groups.every((group, index) => {
    if (!group) return true;
    const next = groups.slice(index + 1).find(Boolean);
    const room = (next ? next.from : right) - group.from - (index === lead ? 10 : 0);
    return label(index).length * captionAdvance + 6 <= room;
  });
  const hidden = parts.map((_, index) => index).filter((index) => !groups[index]);
  // Labels over the groups need a row above the strokes; listed labels don't. The drawing
  // keeps the same box, so building never moves layout.
  const top = fits ? 24 : 4;
  const baseline = top + strokeLength;
  const height = baseline + (fits && hidden.length ? 14 + 16 * hidden.length : 12);

  const exact = (index: number) => (parts[index]!.size / total) * 100;
  const tb = (size: number) => `${size.toFixed(2)} TB`;
  const readout =
    active === null
      ? `${parts.length} kinds · ${tb(total)}`
      : `${parts[active]!.name} · ${tb(parts[active]!.size)} · ${exact(active).toFixed(1)}%`;
  const ranked = parts.map((_, index) => index).sort((a, b) => percents[b]! - percents[a]!);
  const [first, second] = ranked;
  const verb = (index: number) => (parts[index]!.plural ? 'take' : 'takes');
  const summary =
    `${parts[first!]!.name} ${verb(first!)} ${percents[first!]}% of the ${tb(total)} in use` +
    (second === undefined
      ? '.'
      : `, and ${parts[second]!.name.toLowerCase()} ${verb(second)} ${percents[second]}%.`);

  const boxes = parts.map((part, index) => {
    const group = groups[index];
    const from = group ? group.from - pitch / 2 : right;
    const to = group ? group.from + (strokes[index]! + 0.5) * pitch : right;
    return {
      x: from,
      y: 0,
      width: to - from,
      height,
      label: `${part.name}: ${tb(part.size)}, ${exact(index).toFixed(1)}% of the total`,
    };
  });
  const table = {
    columns: [
      { label: 'Kind' },
      { label: 'Size (TB)', numeric: true },
      { label: 'Share', numeric: true },
    ],
    rows: parts.map((part, index) => [
      part.name,
      part.size.toFixed(2),
      `${exact(index).toFixed(1)}%`,
    ]),
  };
  const boundaries = groups
    .filter((group): group is NonNullable<typeof group> => group !== null)
    .slice(1)
    .map((group) => ({ x: group.from - pitch / 2, major: true }));

  return (
    <ChartFrame
      kind="share"
      series={series}
      scale={drawing ? `1 stroke = ${100 / count}%` : `1 stroke = ${100 / count}% · ${tb(total)}`}
      title={title}
      summary={summary}
      readout={readout}
      unit="TB"
      announcement={inspection.announcement}
      table={compact ? undefined : table}
      drawing={drawing}
      drawingLabel="Loading storage by kind"
    >
      <div ref={plotRef} className="chart-plot" style={{ height }}>
        <svg width={width} height={height} aria-hidden="true" focusable="false">
          <Ruler x0={left} x1={right} y={baseline + 6} ticks={drawing ? [] : boundaries} />
          {!drawing && (
            <>
              {groups.map((group, index) =>
                group ? (
                  <path
                    key={parts[index]!.id}
                    data-zao-slot="chart-mark"
                    data-part={parts[index]!.id}
                    data-chart-ink={index === emphasized ? 'data' : 'muted'}
                    d={group.xs.map((x) => `M${crisp(x)} ${top}V${baseline}`).join('')}
                    stroke={
                      index === emphasized
                        ? 'var(--zao-color-fg-default)'
                        : 'var(--zao-color-fg-muted)'
                    }
                    strokeWidth="1"
                    fill="none"
                  />
                ) : null,
              )}
              {fits &&
                groups.map((group, index) =>
                  group ? (
                    <ChartLabel
                      key={parts[index]!.id}
                      x={group.from + (index === lead ? 10 : 0)}
                      y={labelY}
                      anchor="start"
                      strong={index === emphasized}
                    >
                      {label(index)}
                    </ChartLabel>
                  ) : null,
                )}
              {fits && leadGroup && (
                <rect
                  data-zao-slot="chart-accent"
                  className="chart-accent"
                  x={Math.round(leadGroup.from)}
                  y={labelY - 7}
                  width="6"
                  height="6"
                  fill="var(--zao-color-fg-default)"
                />
              )}
              {fits &&
                hidden.map((index, order) => (
                  <ChartLabel
                    key={parts[index]!.id}
                    x={right}
                    y={baseline + 26 + order * 16}
                    anchor="end"
                    strong={index === emphasized}
                  >
                    {label(index)}
                  </ChartLabel>
                ))}
            </>
          )}
        </svg>
        {!drawing && (
          <ChartInspector
            inspection={inspection}
            data={boxes}
            width={width}
            height={height}
            name="storage kinds"
            nearest="box"
          />
        )}
      </div>
      {!fits && (
        <ul
          data-zao-slot="chart-labels"
          aria-hidden="true"
          className={`flex flex-wrap gap-x-4 gap-y-1 font-mono type-caption figures-tabular${drawing ? ' construction-drawing' : ''}`}
        >
          {parts.map((part, index) => (
            <li
              key={part.id}
              className={`flex items-center gap-1.5 ${index === emphasized ? 'text-default' : 'text-muted'}`}
            >
              {index === lead && !drawing && (
                <span data-zao-slot="chart-accent" className="chart-accent-chip" />
              )}
              <span>{drawing ? parts[index]!.id : label(index)}</span>
            </li>
          ))}
        </ul>
      )}
    </ChartFrame>
  );
}

const twoParts: readonly SharePart[] = [
  { id: 'yours', name: 'Yours', size: 1.62, plural: false },
  { id: 'shared', name: 'Shared', size: 0.86, plural: false },
];

/** The strip's edge cases as finished readings. */
export function ShareStates() {
  const states = [
    {
      id: 'two-parts',
      name: 'Two parts',
      node: (
        <ShareStrip compact parts={twoParts} series="storage.by_owner" title="Storage by owner" />
      ),
    },
    {
      id: 'under-one',
      name: 'A part under 1%',
      node: <ShareStrip compact title="Storage by kind, under 1%" />,
    },
    {
      id: 'narrow',
      name: 'Narrow: merged strokes and listed labels',
      node: (
        <div className="max-w-xs min-w-0">
          <ShareStrip compact title="Storage by kind, narrow" />
        </div>
      ),
    },
    {
      id: 'unknown',
      name: 'Unknown',
      node: <ShareStrip compact drawing title="Storage by kind, loading" />,
    },
  ];
  return (
    <ul className="grid min-w-0 gap-4 md:grid-cols-2">
      {states.map((state) => (
        <li
          key={state.id}
          data-zao-share-state={state.id}
          className="flex min-w-0 flex-col gap-3 rounded-surface border border-subtle p-4"
        >
          <h3 className="type-label font-medium">{state.name}</h3>
          {state.node}
        </li>
      ))}
    </ul>
  );
}
