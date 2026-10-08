import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'Progress' };

export default function ProgressPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return <ComponentDetail component="progress" searchParams={searchParams} />;
}
