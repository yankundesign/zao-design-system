import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'Composer' };

export default function ComposerPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return <ComponentDetail component="composer" searchParams={searchParams} />;
}
