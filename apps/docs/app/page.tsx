import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Explore } from '@/components/landing/explore';
import { LandingHero } from '@/components/landing/hero';
import { LandingRoot } from '@/components/landing/landing-root';
import { TwoReaders } from '@/components/landing/two-readers';
import { getQuietInstrumentStudy } from '@/lib/style-studies';
import { allTokens } from '@/lib/tokens';
import '@/components/landing/landing.css';

export const metadata: Metadata = {
  description:
    'ZAO is the foundation for how we build: an experimental design system at the boundary of 2D clarity and 3D presence, built for people and agents.',
};

/** The landing page, following docs/plans/2026-10-landing and the finish plan's WP 3.2. */
export default async function Home() {
  if (process.env.ZAO_DOCS_STATIC_EXPORT !== '1') await connection();
  const study = await getQuietInstrumentStudy();

  return (
    <LandingRoot>
      {study ? <link rel="stylesheet" href={study.cssUrl} /> : null}
      <LandingHero
        contact={Number.parseFloat(String(allTokens['depth.contact']!.value))}
        lift={Number.parseFloat(String(allTokens['depth.lift']!.value))}
      />
      <TwoReaders />
      <Explore />
    </LandingRoot>
  );
}
