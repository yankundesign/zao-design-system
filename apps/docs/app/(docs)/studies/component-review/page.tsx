import type { Metadata } from 'next';
import { connection } from 'next/server';
import { ComponentReviewStudies } from '@/components/studies/component-review';
import { getQuietInstrumentStudy } from '@/lib/style-studies';

export const metadata: Metadata = {
  title: 'Component review studies',
  description: 'Private comparisons for the component review: today beside each proposal.',
  robots: { index: false },
};

/**
 * Docs-local studies for the component review's "study first" gates (wave 2, Nov 13). Not in the
 * nav: Yankun compares each proposal with today's part here, and a row is published only after
 * he chooses. Remove a section when its gate is decided.
 */
export default async function ComponentReviewStudiesPage() {
  if (process.env.ZAO_DOCS_STATIC_EXPORT !== '1') await connection();
  const study = await getQuietInstrumentStudy();

  return (
    <>
      {study ? <link rel="stylesheet" href={study.cssUrl} /> : null}
      <ComponentReviewStudies />
    </>
  );
}
