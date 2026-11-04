import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'Table' };

export default function TablePage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return <ComponentDetail component="table" searchParams={searchParams} />;
}
