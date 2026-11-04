import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'Button' };

export default function ButtonPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return <ComponentDetail component="button" searchParams={searchParams} />;
}
