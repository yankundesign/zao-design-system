import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'Combobox' };

export default function ComboboxPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return <ComponentDetail component="combobox" searchParams={searchParams} />;
}
