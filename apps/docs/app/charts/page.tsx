import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { chartDefinitions } from '@/components/charts/chart-detail';
import { chartOrder } from '@/components/charts/chart-ids';
import { ChartSpecimen } from '@/components/charts/chart-specimens';
import { ChartStudy } from '@/components/charts/chart-study';
import { getQuietInstrumentStudy } from '@/lib/style-studies';

export const metadata: Metadata = { title: 'Charts' };

const rules = [
  {
    name: 'One stroke per datum',
    detail: 'Thin strokes only where each one is an observation, a bin, or one part of a whole.',
  },
  {
    name: 'Solid for structure, dashed for comparison',
    detail:
      'Baselines are solid rulers with end stops; a dashed line always marks a labeled reference.',
  },
  {
    name: 'Four slots around the plot',
    detail:
      'Series and scale above, a summary below, then the readout and unit. Inspection writes into the readout.',
  },
  {
    name: 'One accent square',
    detail:
      'The value that matters most: the latest, the current, the selected, or the single reading.',
  },
  {
    name: 'Motion only from data',
    detail:
      'Still at rest. Live data, or a labeled simulation, updates the chart in discrete steps.',
  },
];

export default async function ChartsOverviewPage() {
  if (process.env.ZAO_DOCS_STATIC_EXPORT !== '1') await connection();
  const quietStudy = await getQuietInstrumentStudy();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="type-title">Charts</h1>
        <p className="type-body text-muted">
          Quiet instruments for reading, inspecting, and understanding change. Every chart follows
          the same five rules from the{' '}
          <Link
            href="/foundations/data-visualization"
            className="text-accent underline outline-focus"
          >
            data visualization guideline
          </Link>
          .
        </p>
      </header>

      <section className="docs-detail-section grid gap-5 border-t border-subtle pt-5">
        <h2 className="type-heading">Five rules</h2>
        <ol data-zao-slot="chart-rules" className="flex max-w-2xl flex-col">
          {rules.map((rule, index) => (
            <li
              key={rule.name}
              className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 border-b border-subtle py-2"
            >
              <span className="font-mono type-caption figures-tabular text-muted">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="type-body font-medium">{rule.name}</span>
                <span className="type-body text-muted">{rule.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="flex flex-col gap-4 border-t border-subtle pt-5"
        aria-labelledby="charts-heading"
      >
        <div className="flex flex-col gap-1">
          <h2 id="charts-heading" className="type-heading">
            All charts
          </h2>
          <p className="type-body text-muted">
            All readings are illustrative. Open a chart for its live simulation, anatomy, and
            accessibility notes.
          </p>
        </div>
        <ChartStudy
          label="Chart gallery"
          cssUrl={quietStudy ? quietStudy.cssUrl : null}
          framed={false}
        >
          <ul className="grid min-w-0 gap-4 lg:grid-cols-2">
            {chartOrder.map((chart) => (
              <li
                key={chart}
                data-zao-gallery-item={chart}
                className="flex min-w-0 flex-col gap-4 rounded-surface border border-subtle p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="type-heading">{chartDefinitions[chart].title}</h3>
                  <Link
                    href={`/charts/${chart}`}
                    className="type-caption text-muted underline outline-focus hover:text-default focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Open {chartDefinitions[chart].title.toLowerCase()} chart
                  </Link>
                </div>
                <ChartSpecimen chart={chart} compact />
              </li>
            ))}
          </ul>
        </ChartStudy>
      </section>
    </div>
  );
}
