import Link from 'next/link';
import { connection } from 'next/server';
import { getQuietInstrumentStudy } from '@/lib/style-studies';
import { ChartStudy } from './chart-study';
import { ChartSpecimen } from './chart-specimens';
import type { ChartId } from './chart-ids';

interface ChartDefinition {
  title: string;
  description: string;
  use: string[];
  anatomy: { part: string; detail: string }[];
  accessibility: string;
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
          'The one accent, in accent-solid. In a single-reading ring it belongs to the reading.',
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
  bar: {
    title: 'Bar',
    description: 'Compare a few categories on one baseline.',
    use: [
      'Use bars to compare up to about a dozen categories that share a unit.',
      'Draw each bar as a needle with a square head, and write the value at the head; the scale stays fixed when values change.',
      'Give the bar the story is about the accent head and full ink; keep the rest in muted ink.',
      'A dashed line marks the average or target, with its value written beside it.',
      'Use segmented level-meter bars only when the data really is a level or comes in steps.',
    ],
    anatomy: [
      { part: 'Baseline', detail: 'A solid hairline ruler with end stops.' },
      {
        part: 'Needles',
        detail: '1.5px strokes from the baseline, with 6px square heads and values above them.',
      },
      { part: 'Accent', detail: 'The lead bar’s head, in accent-solid.' },
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
  },
  line: {
    title: 'Line',
    description: 'Follow one measure over time, against the previous period.',
    use: [
      'Use a line for one measure over a continuous time axis with a named period and unit.',
      'Draw one faint stroke per sample under the trace. A missing reading is a missing stroke and a break in the trace; never bridge it.',
      'Show the previous period as a dashed trace, and put the accent square on the latest sample.',
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
      { part: 'Accent', detail: 'The latest sample, in accent-solid.' },
      ...frameSlots('latency.p95', 'the sampling interval', 'time, value, previous value', 'ms'),
    ],
    accessibility:
      'One tab stop with arrow-key movement across samples; each sample is a native button that names its time, value or missing reading, and previous value. The summary states the latest value, its change, and how many readings are missing. Inspection draws a guide without moving the data.',
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
      { part: 'Current cell', detail: 'Accent corner brackets in accent-solid.' },
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
      'A dashed line marks the median. The accent square marks the bin of the latest observation.',
      'With live data, new observations grow the comb and move the median.',
    ],
    anatomy: [
      { part: 'Comb', detail: 'One 1px fg-default stroke per bin from a solid baseline.' },
      { part: 'Ruler', detail: 'Graduations every 5 minutes, labeled every 15.' },
      { part: 'Reference', detail: 'The dashed median, labeled with its value.' },
      { part: 'Accent', detail: 'The latest observation’s bin, in accent-solid.' },
      ...frameSlots('session.length', 'the bin width', 'bin range and count', 'sessions'),
    ],
    accessibility:
      'One tab stop with arrow-key movement across bins; each bin is a native button that names its range and count. Inspecting a bin mutes the others without changing any length. The summary states the median, the most common length, and the tail.',
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
          <ChartSpecimen chart={chart} />
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

      <section className="docs-detail-section grid gap-5 border-t border-subtle pt-5">
        <h2 className="type-heading">When to use</h2>
        <ul className="flex max-w-2xl list-disc flex-col gap-2 pl-4 type-body text-muted">
          {definition.use.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>
            Follow the{' '}
            <Link className="text-accent underline" href="/foundations/data-visualization">
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
