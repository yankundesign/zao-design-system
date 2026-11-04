import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Gallery } from '@/components/gallery/gallery';
import { chartPlates } from '@/components/gallery/chart-plates';
import { getQuietInstrumentStudy } from '@/lib/style-studies';
import '@/components/gallery/gallery.css';

export const metadata: Metadata = {
  title: 'Chart gallery',
  description: 'Six ZAO charts, live: point at them to inspect the real charts.',
  robots: { index: false },
};

/** The chart wall, beside the components gallery. `?plate=<id>&record` frames one plate. */
export default async function ChartGalleryPage() {
  if (process.env.ZAO_DOCS_STATIC_EXPORT !== '1') await connection();
  const study = await getQuietInstrumentStudy();

  return (
    <>
      {study ? <link rel="stylesheet" href={study.cssUrl} /> : null}
      <Gallery
        plates={chartPlates}
        kind="charts"
        title="Chart gallery"
        description="Six charts, live. Point at them: each plate runs the real chart on illustrative data, arriving as its drawing and then building."
        label="Charts"
      />
    </>
  );
}
