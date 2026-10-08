import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'Dialog' };

export default function DialogPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return <ComponentDetail component="dialog" searchParams={searchParams} />;
}
