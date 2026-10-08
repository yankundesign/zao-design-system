import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'Card' };

export default function CardPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return <ComponentDetail component="card" searchParams={searchParams} />;
}
