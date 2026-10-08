import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'Tabs' };

export default function TabsPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return <ComponentDetail component="tabs" searchParams={searchParams} />;
}
