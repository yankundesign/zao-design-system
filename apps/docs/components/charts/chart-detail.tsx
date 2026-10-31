import Link from 'next/link';
import { connection } from 'next/server';
import { getQuietInstrumentStudy } from '@/lib/style-studies';
import { ChartStudy } from './chart-study';
import { ChartPreview } from './chart-preview';
import { ChartStates } from './chart-states';
import type { ChartForm, ChartId } from './chart-ids';

interface ChartDefinition {
  title: string;
  description: string;
  use: string[];
  anatomy: { part: string; detail: string }[];
  accessibility: string;
  /** Finished readings for the edge cases a chart input must define. */
  states?: string;
  /** A second form of the chart, previewed in its own section (charts wave 2). */
  form?: { id: ChartForm; heading: string; description: string; use: string[] };
}

const frameSlots = (series: string, scale: string, readout: string, unit: string) => [
  {
    part: 'Top row',
    detail: `The series ${series} on the left and ${scale} on the right, in mono.`,
  },
  {
    part: 'Summary',
    detail: 'A title and one sentence in sans that carry the essential reading without inspection.',
  },
  { part: 'Bottom row', detail: `The readout (${readout}) and the unit (${unit}).` },
];

export const chartDefinitions: Record<ChartId, ChartDefinition> = {
  ring: {
    title: 'Ring',
    description: 'One share of a whole, read from a fixed center.',
    use: [
      'Use a ring for a single share of a known total, such as storage used. For several categories, use bars.',
      'Draw one mark per part: the storage ring has 100 marks, one per percentage point.',
      'Keep the reading static. Storage does not simulate updates, animate from zero, or loop.',
      'The ring is the first chart study and also appears in Card.',
    ],
    anatomy: [
      {
        part: 'Scale ring',
        detail:
          'Structure: a solid hairline circle with graduations every 10% and a registration tick at zero.',
      },
      {
        part: 'Marks',
        detail:
          'Data: used marks are long in fg-default; available marks are short in border-default, so the outline steps at the reading.',
      },
      {
        part: 'Center square',
        detail:
          'The one accent, in ink (fg-default). In a single-reading ring it belongs to the reading.',
      },
      {
        part: 'Region controls',
        detail:
          'Used and Available are native buttons; inspecting a region traces it on the scale ring.',
      },
      {
        part: 'Top row',
        detail:
          'The series storage.used on the left and the scale, 1 mark = 1 part, on the right, in mono.',
      },
      {
        part: 'Reading',
        detail:
          'The percentage, its label, and the remainder in sans. In Card, the card title names the chart.',
      },
      {
        part: 'Bottom row',
        detail: 'The readout (Total capacity: 100 parts.) and the unit (parts).',
      },
    ],
    accessibility:
      'The reading is a named image with its value and remainder as visible text. Used and Available are native buttons with pressed state; focus or hover inspects, Enter or Space selects, Escape clears without moving focus. Selection is announced politely. Reduced motion removes the tracing animation; forced colors keep data, scale, and accent distinct.',
  },
  share: {
    title: 'Share strip',
    description: 'How a whole divides among two to five parts, one stroke per percentage point.',
    use: [
      'Use a share strip for how a known whole divides among two to five parts. For one share of a whole, use the ring; for six or more parts, or when exact values matter more than proportion, use Table.',
      'Use a strip instead of a donut or pie: parts read as lengths on one line.',
      'Draw 100 strokes, one per percentage point, rounded by the largest remainder so they always total 100. When the strokes would sit closer than 3px, merge pairs into 50 and say so in the scale slot.',
      'Give every stroke one length. The lead part, or the inspected one, carries full ink; the rest stay muted.',
      'Write each part’s name and whole share over its group. When a label doesn’t fit, every label moves to a list below the strip. A part under one stroke keeps its name, as "<1%".',
      'A composition is a static reading; the strip has no live simulation.',
    ],
    anatomy: [
      {
        part: 'Strokes',
        detail: '1px strokes of one length, one per percentage point, grouped by part.',
      },
      {
        part: 'Groups',
        detail: 'One stroke pitch of gap between parts, ordered by size with Other last.',
      },
      {
        part: 'Ruler',
        detail: 'A solid hairline with end stops and a graduation at each part boundary.',
      },
      { part: 'Labels', detail: 'The part and its whole share over each group, in mono.' },
      { part: 'Accent', detail: 'Beside the lead part’s label, in ink.' },
      ...frameSlots(
        'storage.by_kind',
        'the stroke unit and total',
        'part, size, exact share',
        'TB',
      ),
    ],
    accessibility:
      'One tab stop with arrow-key movement across parts, including parts too small for a stroke. Each part is a native button that names its size and exact share. Pointer inspection uses the part under the pointer. The summary names the two largest parts, and Show data lists every part.',
    states: 'Two parts, a part under one stroke, a narrow strip, and the drawing while it loads.',
  },
  meter: {
    title: 'Meter',
    description: 'How close a measure is to its limit.',
    use: [
      'Use a meter for one measure against a known limit, such as a budget, quota, or capacity. For task completion, use Progress. For one share of a total with no limit, use the ring.',
      'The meter reuses Progress’s recessed well and ink face, and steps between readings without a transition.',
      'Mark an alert or target as a dashed tick across the well, labeled with its value.',
      'Draw a projection only from a stated method, as an outline from the reading to the projected value, never filled. The summary names it.',
      'Above the limit, the face fills the well and a filled square sits past the end stop. The overage is written in the readout and summary, not drawn to scale.',
      'Without a known limit there is nothing to measure against: the meter shows its empty well and says so.',
    ],
    anatomy: [
      { part: 'Well', detail: 'Progress’s recessed track, from zero to the limit.' },
      { part: 'Face', detail: 'The reading in ink, with Progress’s contact edge.' },
      { part: 'Reference', detail: 'The dashed alert, labeled with its value.' },
      {
        part: 'Projection',
        detail: 'A hairline fg-muted outline from the reading to the projected value.',
      },
      {
        part: 'Ruler',
        detail: 'Graduations at each quarter of the limit, with zero and the limit labeled.',
      },
      { part: 'Accent', detail: 'The current reading on the ruler, in ink.' },
      ...frameSlots('budget.spend', 'the period and limit', 'region, amount, share', 'USD'),
    ],
    accessibility:
      'The well is a meter with a name and a value text. Used, Left, and Over are native buttons in one tab stop; focus or hover inspects, Enter, Space, or a tap selects, and Escape clears. The summary carries the reading, the projection and its method, and any overage, and Show data lists every value.',
    states: 'Zero, a fractional reading, full, over the limit, unknown, and no limit.',
  },
  bar: {
    title: 'Bar',
    description: 'Compare a few categories on one baseline.',
    use: [
      'Use bars to compare up to about a dozen categories that share a unit.',
      'Draw each bar as a needle with a square head, and write the value at the head; the scale stays fixed when values change.',
      'Give the bar the story is about the accent head and full ink; keep the rest in muted ink.',
      'A dashed line marks the average or target, with its value written beside it.',
      'Use segmented level-meter bars only when the data really is a level or comes in steps.',
      'For a few categories that are a screen’s main figure, use the prism form below.',
    ],
    anatomy: [
      { part: 'Baseline', detail: 'A solid hairline ruler with end stops.' },
      {
        part: 'Needles',
        detail: '1.5px strokes from the baseline, with 6px square heads and values above them.',
      },
      { part: 'Accent', detail: 'The lead bar’s head, in ink.' },
      { part: 'Reference', detail: 'The dashed average, labeled with its value.' },
      ...frameSlots(
        'calls.by_region',
        'the period',
        'region, calls, difference from average',
        'calls',
      ),
    ],
    accessibility:
      'The chart is one tab stop. Arrow keys, Home, and End move between bars; each bar is a native button named with its region and value. Pointer inspection uses the nearest bar across the whole plot. Enter, Space, or a tap selects; Escape clears. Every value is also written on the chart and the summary names the leader.',
    form: {
      id: 'prism',
      heading: 'Prism form',
      description:
        'The same reading as dimensional bars. At rest each bar is a flat front face carrying the value at true height on the ruler. Hover, focus, or select a bar to see its depth; select it to build it.',
      use: [
        'Use the prism form where a few categories are a screen’s main figure, such as a report’s cover or a summary header. Use needles in dense dashboards and wherever several charts sit together.',
        'Only the inspected bar shows its depth, a third of the face, the same for every bar. The front faces never move, the dashed average stays in the front plane, and nothing sits on a back wall.',
        'Whether the depth helps comprehension is a hypothesis until a comparison with needles supports it.',
      ],
    },
  },
  line: {
    title: 'Line',
    description: 'Follow one measure over time, against the previous period.',
    use: [
      'Use a line for one measure over a continuous time axis with a named period and unit.',
      'Draw one faint stroke per sample under the trace. A missing reading is a missing stroke and a break in the trace; never bridge it.',
      'Show the previous period as a dashed trace, and put the accent square on the latest sample.',
      'Mark events such as deploys and restarts with a tick through the ruler and a short label in their own lane. The readout, the sample’s name and the data view carry the full name.',
      'With live data, the trace scrolls left one sample at a time and the "now" end stays fixed.',
    ],
    anatomy: [
      {
        part: 'Grid and ruler',
        detail:
          'Solid hairline gridlines at round values and a time ruler with graduations every 2 hours.',
      },
      {
        part: 'Sample strokes',
        detail: 'One border-subtle stroke per observation, showing cadence and gaps.',
      },
      { part: 'Trace', detail: 'A 1.5px fg-default line that breaks at missing readings.' },
      { part: 'Reference', detail: 'The previous period as a dashed fg-muted trace.' },
      { part: 'Accent', detail: 'The latest sample, in ink.' },
      {
        part: 'Events',
        detail:
          'A 1px fg-muted tick through the ruler, from 6px above to 10px below, with a short mono label in the lane below the time labels.',
      },
      ...frameSlots(
        'latency.p95',
        'the sampling interval',
        'time, value, previous value, event',
        'ms',
      ),
    ],
    accessibility:
      'One tab stop with arrow-key movement across samples; each sample is a native button that names its time, value or missing reading, previous value, and any event. The summary states the latest value, its change, what followed the latest event, and how many readings are missing. Inspection draws a guide without moving the data.',
    form: {
      id: 'forecast',
      heading: 'Forecast',
      description:
        'The same line with 4 hours of forecast after "now", drawn as hollow samples: the past is built, and the future is a drawing.',
      use: [
        'Show a forecast only from a stated method on real history, and name the method in the summary. Never extend a line by eye.',
        'This forecast takes the same time yesterday, shifted by today’s average difference from yesterday over the last 6 hours. With fewer than 6 of those readings there is no forecast, and the summary says so.',
        'Forecast samples are inspectable and named "forecast"; the data view lists them in their own column.',
      ],
    },
  },
  heatmap: {
    title: 'Heatmap',
    description: 'See when activity happens across two cycles.',
    use: [
      'Use a heatmap for a measure across two cycles, such as days and hours.',
      'Keep to five gray steps with a legend. If readers need more steps, use a table.',
      'Mark the current cell with accent brackets; a gray ramp cannot also carry an accent fill.',
      'Show cells with no data yet as a small dot. Unknown is not zero.',
    ],
    anatomy: [
      {
        part: 'Cells',
        detail:
          'Squares with a 2px gap and no borders, filled from a five-step neutral ramp (pending DV3).',
      },
      { part: 'Current cell', detail: 'Accent corner brackets in ink.' },
      { part: 'Unknown', detail: 'A 2px fg-muted dot where no data exists yet.' },
      { part: 'Legend', detail: 'The five steps with their lower bounds, and the no-data dot.' },
      ...frameSlots('events.by_hour', 'the period', 'day, hour, events', 'events'),
    ],
    accessibility:
      'One tab stop; Left and Right move by hour, Up and Down move by day, Home and End jump to the ends. Each cell is a native button that names its day, hour, and value or "no data yet". Pointer inspection uses the cell under the pointer. The summary names the peak and the missing days.',
  },
  histogram: {
    title: 'Histogram',
    description: 'See how values are spread, one stroke per bin.',
    use: [
      'Use a histogram for the distribution of one measure, with a named bin width.',
      'Draw one hairline per bin. Keep at least 3px between strokes; on narrow screens the chart merges bins and says so in the scale slot.',
      'Dashed lines mark p50, p95 and p99, each labeled with its value. The accent square marks the bin of the latest observation.',
      'With live data, new observations grow the comb and move the percentiles.',
    ],
    anatomy: [
      { part: 'Comb', detail: 'One 1px fg-default stroke per bin from a solid baseline.' },
      { part: 'Ruler', detail: 'Graduations every 5 minutes, labeled every 15.' },
      {
        part: 'References',
        detail:
          'Dashed p50, p95 and p99 at their bins’ upper edges. Labels share one row and step into a second only where they would touch.',
      },
      { part: 'Accent', detail: 'The latest observation’s bin, in ink.' },
      ...frameSlots('session.length', 'the bin width', 'bin range and count', 'sessions'),
    ],
    accessibility:
      'One tab stop with arrow-key movement across bins; each bin is a native button that names its range and count. Inspecting a bin mutes the others without changing any length. The summary states p50, p95 and p99 and the most common length.',
    form: {
      id: 'compare',
      heading: 'Compared with last week',
      description:
        'This week rises above the ruler and last week hangs below it, with the same bins and the same scale, so equal counts are equal lengths.',
      use: [
        'Use a mirrored comparison for two periods of the same measure. Each half marks its own median.',
        'Only the current period updates; last week is finished.',
        'Each bin is one datum covering both weeks, and the data view lists both.',
      ],
    },
  },
};

export async function ChartDetail({ chart }: { chart: ChartId }) {
  if (process.env.ZAO_DOCS_STATIC_EXPORT !== '1') await connection();
  const definition = chartDefinitions[chart];
  const quietStudy = await getQuietInstrumentStudy();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="type-title">{definition.title}</h1>
        <p className="type-body text-muted">{definition.description}</p>
      </header>

      <section className="flex flex-col gap-4" aria-labelledby="preview-heading">
        <div className="flex flex-col gap-1">
          <h2 id="preview-heading" className="type-heading">
            Preview
          </h2>
          <p className="type-body text-muted">
            Su uses the Quiet instrument direction. Hover, tap, or tab into the chart to inspect it.
          </p>
        </div>
        <ChartStudy
          label={`${definition.title} chart preview`}
          cssUrl={quietStudy ? quietStudy.cssUrl : null}
        >
          <ChartPreview chart={chart} />
        </ChartStudy>
        {chart === 'ring' && (
          <p className="type-caption text-muted">
            See the ring in context on the{' '}
            <Link href="/components/card" className="text-default underline outline-focus">
              Card page
            </Link>
            .
          </p>
        )}
      </section>

      {definition.form && (
        <section
          className="docs-detail-section grid gap-5 border-t border-subtle pt-5"
          data-zao-chart-form={definition.form.id}
        >
          <div className="flex flex-col gap-1">
            <h2 className="type-heading">{definition.form.heading}</h2>
            <p className="max-w-2xl type-body text-muted">{definition.form.description}</p>
          </div>
          <ChartStudy
            label={`${definition.title} ${definition.form.heading.toLowerCase()}`}
            cssUrl={quietStudy ? quietStudy.cssUrl : null}
          >
            <ChartPreview chart={chart} form={definition.form.id} />
          </ChartStudy>
          <ul className="flex max-w-2xl list-disc flex-col gap-2 pl-4 type-body text-muted">
            {definition.form.use.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {definition.states && (
        <section className="docs-detail-section grid gap-5 border-t border-subtle pt-5">
          <div className="flex flex-col gap-1">
            <h2 className="type-heading">States</h2>
            <p className="max-w-2xl type-body text-muted">{definition.states}</p>
          </div>
          <ChartStudy
            label={`${definition.title} states`}
            cssUrl={quietStudy ? quietStudy.cssUrl : null}
            framed={false}
          >
            <ChartStates chart={chart} />
          </ChartStudy>
        </section>
      )}

      <section className="docs-detail-section grid gap-5 border-t border-subtle pt-5">
        <h2 className="type-heading">When to use</h2>
        <ul className="flex max-w-2xl list-disc flex-col gap-2 pl-4 type-body text-muted">
          {definition.use.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>
            Follow the{' '}
            <Link className="text-default underline" href="/foundations/data-visualization">
              data visualization guideline
            </Link>{' '}
            for the five rules every chart shares.
          </li>
        </ul>
      </section>

      <section className="docs-detail-section grid gap-5 border-t border-subtle pt-5">
        <h2 className="type-heading">Anatomy</h2>
        <dl className="flex max-w-2xl flex-col">
          {definition.anatomy.map(({ part, detail }) => (
            <div
              key={part}
              className="grid gap-1 border-b border-subtle py-2 md:grid-cols-[140px_minmax(0,1fr)] md:gap-4"
            >
              <dt className="type-body font-medium">{part}</dt>
              <dd className="type-body text-muted">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="docs-detail-section grid gap-5 border-t border-subtle pt-5">
        <h2 className="type-heading">Accessibility</h2>
        <p className="max-w-2xl type-body text-muted">{definition.accessibility}</p>
      </section>
    </div>
  );
}
