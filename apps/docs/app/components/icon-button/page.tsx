import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'IconButton' };

export default function IconButtonPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return <ComponentDetail component="icon-button" searchParams={searchParams} />;
}
