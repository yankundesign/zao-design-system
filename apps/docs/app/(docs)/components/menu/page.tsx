import type { Metadata } from 'next';
import { ComponentDetail } from '@/components/component-detail';
import type { ComponentSearchParams } from '@/components/component-detail';

export const metadata: Metadata = { title: 'Menu' };

export default function MenuPage({ searchParams }: { searchParams: ComponentSearchParams }) {
  return <ComponentDetail component="menu" searchParams={searchParams} />;
}
