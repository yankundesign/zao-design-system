import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'Select' };

export default function SelectPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return <ComponentDetail component="select" searchParams={searchParams} />;
}
