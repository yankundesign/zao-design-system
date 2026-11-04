import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Gallery } from '@/components/gallery/gallery';
import { getQuietInstrumentStudy } from '@/lib/style-studies';
import '@/components/gallery/gallery.css';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Eight ZAO components, live: point, press, type and tab through the real parts.',
  robots: { index: false },
};

/**
 * A docs-local wall of live components, after the bencho.dev study (Oct 31). Not in the nav until
 * Yankun decides whether it joins the site; `?plate=<id>&record` frames one plate for recording.
 */
export default async function GalleryPage() {
  if (process.env.ZAO_DOCS_STATIC_EXPORT !== '1') await connection();
  const study = await getQuietInstrumentStudy();

  return (
    <>
      {study ? <link rel="stylesheet" href={study.cssUrl} /> : null}
      <Gallery />
    </>
  );
}
