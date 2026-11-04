import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AnatomySource } from '@/components/anatomy-source';
import { anatomyKinds, type AnatomyKind } from '@/lib/anatomy';
import { getQuietInstrumentStudy } from '@/lib/style-studies';

export const metadata: Metadata = {
  title: 'Anatomy source',
  robots: { index: false, follow: false },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return anatomyKinds.map((kind) => ({ kind }));
}

export default async function AnatomySourcePage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!anatomyKinds.includes(kind as AnatomyKind)) notFound();
  const study = await getQuietInstrumentStudy();
  return <AnatomySource kind={kind as AnatomyKind} studyCssUrl={study?.cssUrl} />;
}
