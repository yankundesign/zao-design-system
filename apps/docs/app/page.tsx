import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { OverviewExhibition } from '@/components/overview-exhibition';
import { getQuietInstrumentStudy } from '@/lib/style-studies';
import { allTokens } from '@/lib/tokens';

export const metadata: Metadata = {
  description:
    'ZAO explores the boundary between 2D clarity and 3D presence through quiet construction. One Su design system, refined in light and dark, for people and agents.',
};

const foundationLinks = [
  ['Color', '/foundations/color'],
  ['Typography', '/foundations/typography'],
  ['Space', '/foundations/space'],
  ['Design notes', '/foundations/design'],
] as const;

const documentLink =
  'inline-flex min-h-6 items-center type-caption text-muted underline underline-offset-2 outline-focus hover:text-default focus-visible:outline-2 focus-visible:outline-offset-2';

export default async function Home() {
  if (process.env.ZAO_DOCS_STATIC_EXPORT !== '1') await connection();
  const study = await getQuietInstrumentStudy();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex max-w-2xl flex-col gap-3">
        <p className="type-caption text-muted">v0.1 · Su 素 · In progress</p>
        <h1 className="type-display text-balance">ZAO is the foundation for how we build.</h1>
        <p className="type-body text-muted">
          An experimental design system exploring 2D clarity and 3D presence through quiet
          construction.
        </p>
      </header>

      <OverviewExhibition
        quietStudy={study ? { title: study.title, cssUrl: study.cssUrl } : null}
      />

      <section aria-labelledby="foundations-heading" className="flex min-w-0 flex-col gap-4">
        <h2 id="foundations-heading" className="type-label text-muted">
          Shared foundations
        </h2>
        <div className="grid min-w-0 gap-6 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-4 border-t border-subtle pt-4">
            <div className="flex flex-col gap-1">
              <p className="type-heading">North workspace</p>
              <p className="type-body text-muted">A place for your team.</p>
              <p className="type-code figures-id text-muted">Workspace / 001</p>
            </div>
            <Link className={documentLink} href="/foundations/typography">
              Type roles
            </Link>
          </div>
          <div className="flex min-w-0 flex-col gap-4 border-t border-subtle pt-4">
            <div className="flex flex-col items-end gap-1 type-body figures-tabular">
              <span>12.00</span>
              <span>68.00</span>
              <span>100.00</span>
            </div>
            <Link className={documentLink} href="/foundations/typography">
              Tabular figures
            </Link>
          </div>
          <div className="flex min-w-0 flex-col gap-4 border-t border-subtle pt-4">
            <dl className="flex flex-col gap-2 type-caption figures-tabular">
              {[1, 2, 3].map((step) => {
                const token = allTokens[`space.${step}`]!;
                return (
                  <div key={step} className="flex min-w-0 items-center justify-between gap-4">
                    <dt>{step} fen</dt>
                    <dd className="flex items-center gap-3 text-muted">
                      <span
                        aria-hidden="true"
                        className="h-3 shrink-0 bg-accent"
                        style={{ width: `var(${token.cssVar})` }}
                      />
                      <span>{String(token.value)}</span>
                    </dd>
                  </div>
                );
              })}
            </dl>
            <Link className={documentLink} href="/foundations/space">
              Fen spacing
            </Link>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-subtle pt-4">
        <p className="type-body text-muted">
          Shared parts, semantic tokens, and clear guidance for people and agents.
        </p>
        <nav aria-label="Explore foundations" className="flex flex-wrap gap-x-5 gap-y-1">
          {foundationLinks.map(([label, href]) => (
            <Link key={href} className={documentLink} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}
